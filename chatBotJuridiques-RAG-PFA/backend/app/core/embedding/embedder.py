"""
embedder.py — Génération des embeddings avec BGE-M3 (Gratuit, Local)
Modèle multilingue excellent pour l'arabe : BAAI/bge-m3
"""
import time
from typing import List, Optional
from sentence_transformers import SentenceTransformer
import torch

from app.config import settings
from app.logger import rag_logger


class BGEEmbedder:
    """
    Génère des embeddings vectoriels avec le modèle BGE-M3.
    Singleton : le modèle est chargé une seule fois au démarrage.

    Téléchargement automatique depuis HuggingFace (~570MB) au premier lancement.
    """

    _instance: Optional["BGEEmbedder"] = None
    _model: Optional[SentenceTransformer] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def load_model(self):
        """Charge le modèle BGE-M3 (appelé une fois au démarrage de l'app)."""
        if self._model is not None:
            return

        rag_logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
        device = settings.EMBEDDING_DEVICE

        # Vérification GPU disponible
        if device == "auto":
            device = "cuda" if torch.cuda.is_available() else "cpu"

        self._model = SentenceTransformer(
            settings.EMBEDDING_MODEL,
            device=device,
        )
        rag_logger.info(f"BGE-M3 loaded on: {device}")

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """
        Génère des embeddings pour une liste de textes.

        Args:
            texts: Liste de textes à embedder

        Returns:
            Liste d'embeddings (vecteurs float)
        """
        if self._model is None:
            self.load_model()

        if not texts:
            return []

        start_time = time.perf_counter()
        # BGE-M3 : utiliser le préfixe de passage pour les documents
        prefixed = [f"passage: {t}" for t in texts]

        embeddings = self._model.encode(
            prefixed,
            batch_size=32,        # Batch pour efficacité mémoire
            show_progress_bar=False,
            normalize_embeddings=True,  # Normalisation L2 pour cosine similarity
            convert_to_numpy=True,
        )
        
        duration_ms = (time.perf_counter() - start_time) * 1000
        rag_logger.info("Embedded batch of texts", extra={
            "count": len(texts),
            "duration_ms": round(duration_ms, 2)
        })
        
        return embeddings.tolist()

    def embed_query(self, query: str) -> List[float]:
        """
        Génère l'embedding d'une question utilisateur.
        BGE-M3 utilise un préfixe différent pour les requêtes.

        Args:
            query: Question de l'utilisateur

        Returns:
            Vecteur d'embedding
        """
        if self._model is None:
            self.load_model()

        start_time = time.perf_counter()
        # BGE-M3 : préfixe "query:" pour les questions (améliore les résultats)
        prefixed_query = f"query: {query}"

        embedding = self._model.encode(
            prefixed_query,
            normalize_embeddings=True,
            convert_to_numpy=True,
        )
        
        duration_ms = (time.perf_counter() - start_time) * 1000
        rag_logger.info("Embedded query", extra={"duration_ms": round(duration_ms, 2)})
        
        return embedding.tolist()

    @property
    def is_loaded(self) -> bool:
        return self._model is not None


# Instance globale (singleton)
embedder = BGEEmbedder()
