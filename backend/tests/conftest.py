"""
Pytest configuration and fixtures.
"""
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import NullPool

import app.infrastructure.database.session as session_module
from app.core.config import settings


@pytest_asyncio.fixture(autouse=True, scope="function")
async def setup_test_db():
    # Replace global engine with NullPool engine for asyncio pytest compatibility
    test_engine = create_async_engine(
        settings.get_database_url(),
        echo=False,
        future=True,
        poolclass=NullPool,
    )
    session_module.engine = test_engine
    session_module.AsyncSessionLocal.configure(bind=test_engine)
    yield
    await test_engine.dispose()
