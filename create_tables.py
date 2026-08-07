"""
CharityAI – Table Creation Script
"""
import asyncio
import importlib
import os
import sys

# Ensure backend/ is in python import path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Set test environment so asyncpg uses NullPool
os.environ["PYTEST_CURRENT_TEST"] = "1"

# Dynamic imports prevent static linter path warnings when script is executed outside backend package
session = importlib.import_module("app.infrastructure.database.session")
engine, Base = session.engine, session.Base

importlib.import_module("app.infrastructure.database.models.users")
importlib.import_module("app.infrastructure.database.models.donations")
importlib.import_module("app.infrastructure.database.models.organizations")
importlib.import_module("app.infrastructure.database.models.core")


async def create_tables() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[OK] All tables created/verified successfully.")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(create_tables())
