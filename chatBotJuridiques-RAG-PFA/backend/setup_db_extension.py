import asyncio
import asyncpg
from app.config import get_settings

async def create_extension():
    settings = get_settings()
    # Replace the +asyncpg part so asyncpg.connect can use the URI properly
    db_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    
    try:
        conn = await asyncpg.connect(db_url)
        print("Connected to database. Creating uuid-ossp extension...")
        await conn.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        print("Extension created successfully.")
        await conn.close()
    except Exception as e:
        print(f"Failed to create extension: {e}")

if __name__ == "__main__":
    asyncio.run(create_extension())