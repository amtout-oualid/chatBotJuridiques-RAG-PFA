import asyncio
import os
import glob
from app.core.ingestion.gpt4o_extractor import GPT4oExtractor
from app.core.ingestion.chunker import ArabicChunker
from app.core.retrieval.vector_store import vector_store

async def main():
    print("Starting Offline Ingestion...")
    extractor = GPT4oExtractor()
    chunker = ArabicChunker()
    
    # Point to the static PDFs folder
    # This is where you should put your legal PDF documents
    pdf_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "rag-legal-arabic", "data", "pdfs")
    pdf_files = glob.glob(os.path.join(pdf_dir, "*.pdf"))
    
    if not pdf_files:
        print(f"No PDFs found in {pdf_dir}. Please check the path.")
        return

    for pdf_path in pdf_files:
        doc_name = os.path.basename(pdf_path)
        print(f"\nProcessing {doc_name}...")
        
        try:
            # 1. GPT-4o Semantic OCR
            pages = extractor.extract_all_pages(pdf_path)
            
            # 2. Parse XML Tags (<chunk> and <table>)
            chunks = chunker.chunk_document(pages, doc_name)
            
            # 3. Embed & Save to ChromaDB
            if chunks:
                vector_store.add_chunks(chunks, document_id=doc_name)
                print(f"Saved {len(chunks)} chunks to Vector DB.")
            else:
                print(f"No chunks extracted from {doc_name}.")
        except Exception as e:
            print(f"Error processing {doc_name}: {e}")
            
    print("\nIngestion Complete! Vector DB is ready.")

if __name__ == "__main__":
    asyncio.run(main())
