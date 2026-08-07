"""
CharityAI – Pytest Integration Tests for Authentication API
"""
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.mark.asyncio
async def test_health_check_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] in ("healthy", "degraded")


@pytest.mark.asyncio
async def test_register_duplicate_email():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "first_name": "Test",
            "last_name": "User",
            "email": "existing@charityai.org",
            "password": "Password123!",
        }
        # First registration attempt
        await ac.post("/api/v1/auth/register", json=payload)
        # Duplicate registration attempt
        res = await ac.post("/api/v1/auth/register", json=payload)
    assert res.status_code in (400, 409)
