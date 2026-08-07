"""
One-time script to create NGO requirement tables using SQLAlchemy create_all.
Run from backend/ with: python create_tables.py
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set test environment so asyncpg uses NullPool
os.environ["PYTEST_CURRENT_TEST"] = "1"

from app.infrastructure.database.session import engine, Base

import app.infrastructure.database.models.users  # noqa
import app.infrastructure.database.models.donations  # noqa
import app.infrastructure.database.models.organizations  # noqa
import app.infrastructure.database.models.core  # noqa


async def create_tables() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[OK] All tables created/verified successfully.")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(create_tables())
