import os
import chromadb
from chromadb.config import Settings

# Adjust this if your persist directory or collection name is different
PERSIST_DIR = "./chroma_db"
COLLECTION_NAME = "legal_docs_arabic"
OUTPUT_FILE = "chroma_db_dump.txt"

def view_chroma():
    output_lines = []
    
    output_lines.append("==================================================")
    output_lines.append("🔍 CHROMADB VECTOR EXPLORER")
    output_lines.append("==================================================\n")

    if not os.path.exists(PERSIST_DIR):
        output_lines.append(f"❌ Error: ChromaDB folder '{PERSIST_DIR}' not found.")
        _write_to_file(output_lines)
        return

    # 1. Connect to the local database
    client = chromadb.PersistentClient(
        path=PERSIST_DIR,
        settings=Settings(anonymized_telemetry=False)
    )

    try:
        collection = client.get_collection(name=COLLECTION_NAME)
    except Exception as e:
        output_lines.append(f"❌ Error: Collection '{COLLECTION_NAME}' not found.")
        _write_to_file(output_lines)
        return

    # 2. Get high-level stats
    total_chunks = collection.count()
    output_lines.append(f"📊 TOTAL CHUNKS IN DATABASE: {total_chunks}\n")

    if total_chunks == 0:
        output_lines.append("The database is currently empty.")
        _write_to_file(output_lines)
        return

    # 3. Retrieve all metadata to see which documents are indexed
    output_lines.append("📑 INDEXED DOCUMENTS:")
    all_data = collection.get(include=["metadatas", "documents"])
    
    unique_docs = set()
    doc_chunk_counts = {}

    for meta in all_data["metadatas"]:
        doc_name = meta.get("document_name", "Unknown Document")
        unique_docs.add(doc_name)
        doc_chunk_counts[doc_name] = doc_chunk_counts.get(doc_name, 0) + 1

    for doc in unique_docs:
        output_lines.append(f"   - {doc} ({doc_chunk_counts[doc]} chunks)")

    # 4. Show a sample of ALL chunks
    output_lines.append("\n==================================================")
    output_lines.append("📝 FULL DATA DUMP (All Chunks)")
    output_lines.append("==================================================\n")

    for i in range(total_chunks):
        chunk_id = all_data["ids"][i]
        meta = all_data["metadatas"][i]
        text = all_data["documents"][i]
        
        output_lines.append(f"🔹 CHUNK ID: {chunk_id}")
        output_lines.append(f"   Document: {meta.get('document_name')} | Page: {meta.get('page_number')} | Is Table: {meta.get('is_table')}")
        output_lines.append(f"   Text Snippet:")
        # We save the full text to the file instead of a preview
        output_lines.append(f"   \"{text}\"\n")
        output_lines.append("-" * 50)

    _write_to_file(output_lines)

def _write_to_file(lines):
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"✅ ChromaDB dump successfully saved to {OUTPUT_FILE} (UTF-8 format).")

if __name__ == "__main__":
    view_chroma()