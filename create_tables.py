"""
One-time script to create NGO requirement tables using SQLAlchemy create_all.
Run with: python backend/create_tables.py
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Set test environment so asyncpg uses NullPool
os.environ['PYTEST_CURRENT_TEST'] = '1'

from app.infrastructure.database.session import engine, Base
from app.infrastructure.database.models import users, donations, organizations, core

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ All tables created/verified successfully.")
    await engine.dispose()

if __name__ == '__main__':
    asyncio.run(create_tables())
