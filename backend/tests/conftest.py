"""
Pytest configuration and fixtures.
"""
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import NullPool

import app.infrastructure.database.session as session_module
from app.core.config import settings


@pytest_asyncio.fixture
async def async_client():
    from httpx import AsyncClient, ASGITransport
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        yield client

