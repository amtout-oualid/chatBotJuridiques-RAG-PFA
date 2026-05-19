import asyncio
from app.database import AsyncSessionLocal
from app.services.editor_service import compile_latex
import uuid

async def main():
    async with AsyncSessionLocal() as db:
        doc_id = uuid.UUID("f371da96-20cf-4d46-9523-baa8dd713b17")
        from sqlalchemy import select
        from app.models import FichierUtilisateur
        
        result = await db.execute(select(FichierUtilisateur).where(FichierUtilisateur.document_id == doc_id))
        files = list(result.scalars().all())
        print(f"Found {len(files)} files for this project.")
        
        res = await compile_latex("test latex code", project_files=files)
        print("Compile result:", res)

if __name__ == "__main__":
    asyncio.run(main())
