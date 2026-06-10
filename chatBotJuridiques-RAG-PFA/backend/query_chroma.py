import sys
import os

# Add backend directory to sys.path so 'app' module can be found
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.retrieval.vector_store import vector_store

def run():
    print(f"Total chunks in vector store: {vector_store.total_chunks}")
    
    docs = vector_store.collection.get(include=["metadatas", "documents"])
    ids = docs["ids"]
    metadatas = docs["metadatas"]
    documents = docs["documents"]
    
    print("\n--- Sample Data ---")
    for i in range(min(2, len(ids))):
        print(f"Chunk ID: {ids[i]}")
        print(f"Metadata: {metadatas[i]}")
        print(f"Document snippet: {documents[i][:100]}...\n")

if __name__ == "__main__":
    run()
