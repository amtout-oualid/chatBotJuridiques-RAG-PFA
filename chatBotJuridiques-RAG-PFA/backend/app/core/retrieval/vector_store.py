"""
vector_store.py — Gestion de la base vectorielle ChromaDB
Stocke et recherche les chunks de documents juridiques arabes
"""
import time
import uuid
import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config import settings
from app.core.embedding.embedder import embedder
from app.logger import chroma_logger


class VectorStore:
    """
    Interface ChromaDB pour stocker et rechercher les chunks de documents.
    La collection est persistante sur disque (chroma_db/).
    """

    def __init__(self):
        chroma_logger.info("Initializing ChromaDB VectorStore", extra={"persist_dir": settings.CHROMA_PERSIST_DIR})
        try:
            self.client = chromadb.PersistentClient(
                path=settings.CHROMA_PERSIST_DIR,
                settings=ChromaSettings(anonymized_telemetry=False),
            )
            self.collection_name = settings.CHROMA_COLLECTION_NAME
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"},  # Similarité cosine pour BGE-M3
            )
            chroma_logger.info(f"ChromaDB collection '{self.collection_name}' initialized", extra={"total_chunks": self.collection.count()})
        except Exception as e:
            chroma_logger.error(f"Failed to initialize ChromaDB collection: {e}", exc_info=True)
            raise

    def add_chunks(
        self,
        chunks: List[dict],
        document_id: str,
        collection_id: Optional[str] = None,
    ) -> int:
        if not chunks:
            chroma_logger.warning("Empty chunks list provided to add_chunks", extra={"document_id": document_id})
            return 0

        start_time = time.perf_counter()
        ids = []
        documents = []
        embeddings = []
        metadatas = []

        # Génération des embeddings en batch
        texts_to_embed = [c.get("embed_text", c["text"]) for c in chunks]
        batch_embeddings = embedder.embed_texts(texts_to_embed)

        for i, (chunk, embedding) in enumerate(zip(chunks, batch_embeddings)):
            chunk_id = str(uuid.uuid4())
            ids.append(chunk_id)
            documents.append(chunk["text"])
            embeddings.append(embedding)
            meta = {
                **chunk["metadata"],
                "document_id": document_id,
                "indexed_at": datetime.utcnow().isoformat(),
            }
            if collection_id:
                meta["collection_id"] = collection_id
            metadatas.append(meta)

        try:
            self.collection.add(
                ids=ids,
                documents=documents,
                embeddings=embeddings,
                metadatas=metadatas,
            )
            duration_ms = (time.perf_counter() - start_time) * 1000
            chroma_logger.info("Added chunks into ChromaDB", extra={
                "collection": self.collection_name,
                "document_id": document_id,
                "num_chunks": len(ids),
                "duration_ms": round(duration_ms, 2)
            })
            return len(ids)
        except Exception as e:
            chroma_logger.error(f"Failed to add chunks into ChromaDB: {e}", extra={"document_id": document_id}, exc_info=True)
            raise

    def search(
        self,
        query: str,
        top_k: int = None,
        document_id: Optional[str] = None,
        collection_id: Optional[str] = None,
    ) -> List[Dict]:
        top_k = top_k or settings.TOP_K_RETRIEVAL
        start_time = time.perf_counter()
        query_embedding = embedder.embed_query(query)

        if document_id:
            where_filter = {"document_id": document_id}
        elif collection_id:
            where_filter = {"collection_id": collection_id}
        else:
            where_filter = None

        try:
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=min(top_k, self.collection.count() or 1),
                where=where_filter,
                include=["documents", "metadatas", "distances"],
            )

            chunks = []
            if results["documents"] and results["documents"][0]:
                for doc, meta, dist in zip(
                    results["documents"][0],
                    results["metadatas"][0],
                    results["distances"][0],
                ):
                    score = 1 - dist
                    chunks.append({
                        "text": doc,
                        "metadata": meta,
                        "score": round(score, 4),
                    })

            duration_ms = (time.perf_counter() - start_time) * 1000
            chroma_logger.info("ChromaDB vector search executed", extra={
                "collection": self.collection_name,
                "query": query,
                "top_k": top_k,
                "results_found": len(chunks),
                "duration_ms": round(duration_ms, 2)
            })
            return chunks
        except Exception as e:
            chroma_logger.error(f"ChromaDB search failed: {e}", extra={"query": query}, exc_info=True)
            return []

    def delete_document(self, document_id: str) -> int:
        start_time = time.perf_counter()
        try:
            results = self.collection.get(
                where={"document_id": document_id},
                include=["documents"],
            )
            ids_to_delete = results["ids"]
            if ids_to_delete:
                self.collection.delete(ids=ids_to_delete)
                duration_ms = (time.perf_counter() - start_time) * 1000
                chroma_logger.info("Deleted document chunks from ChromaDB", extra={
                    "collection": self.collection_name,
                    "document_id": document_id,
                    "chunks_deleted": len(ids_to_delete),
                    "duration_ms": round(duration_ms, 2)
                })
            return len(ids_to_delete)
        except Exception as e:
            chroma_logger.error(f"Failed to delete document chunks from ChromaDB: {e}", extra={"document_id": document_id}, exc_info=True)
            raise

    def delete_collection(self, collection_id: str) -> int:
        start_time = time.perf_counter()
        try:
            results = self.collection.get(
                where={"collection_id": collection_id},
                include=["documents"],
            )
            ids_to_delete = results["ids"]
            if ids_to_delete:
                self.collection.delete(ids=ids_to_delete)
                duration_ms = (time.perf_counter() - start_time) * 1000
                chroma_logger.info("Deleted collection chunks from ChromaDB", extra={
                    "collection": self.collection_name,
                    "target_collection_id": collection_id,
                    "chunks_deleted": len(ids_to_delete),
                    "duration_ms": round(duration_ms, 2)
                })
            return len(ids_to_delete)
        except Exception as e:
            chroma_logger.error(f"Failed to delete collection chunks from ChromaDB: {e}", extra={"collection_id": collection_id}, exc_info=True)
            raise

    def get_all_documents(self) -> List[Dict]:
        start_time = time.perf_counter()
        try:
            results = self.collection.get(include=["metadatas"])
            seen_ids = set()
            documents = []

            for meta in results["metadatas"]:
                doc_id = meta.get("document_id")
                if doc_id and doc_id not in seen_ids:
                    seen_ids.add(doc_id)
                    documents.append({
                        "document_id": doc_id,
                        "filename": meta.get("document_name", ""),
                        "indexed_at": meta.get("indexed_at", ""),
                    })

            duration_ms = (time.perf_counter() - start_time) * 1000
            chroma_logger.info("Fetched all documents from ChromaDB", extra={"duration_ms": round(duration_ms, 2)})
            return documents
        except Exception as e:
            chroma_logger.error(f"Failed to get all documents from ChromaDB: {e}", exc_info=True)
            return []

    def count_chunks_for_document(self, document_id: str) -> int:
        try:
            results = self.collection.get(where={"document_id": document_id})
            return len(results["ids"])
        except Exception as e:
            chroma_logger.error(f"Failed to count chunks for document: {e}", extra={"document_id": document_id}, exc_info=True)
            return 0

    @property
    def total_chunks(self) -> int:
        try:
            return self.collection.count()
        except Exception as e:
            chroma_logger.error(f"Failed to get total chunk count: {e}", exc_info=True)
            return 0


# Instance globale
vector_store = VectorStore()
