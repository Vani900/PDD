"""
CharityAI – Full Production E2E Authentication Test Suite (PostgreSQL)
"""
import uuid
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.mark.asyncio
async def test_full_auth_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Registration
        email = f"e2e_auth_{uuid.uuid4().hex[:6]}@charityai.org"
        password = "Password123!"
        reg_res = await client.post("/api/v1/auth/register", json={
            "first_name": "E2E",
            "last_name": "AuthTester",
            "email": email,
            "password": password,
            "role": "donor"
        })
        assert reg_res.status_code == 201, reg_res.text
        reg_data = reg_res.json()
        assert reg_data["email"] == email
        user_id = reg_data["user_id"]

        # 2. Verify Email OTP
        otp_res = await client.post("/api/v1/auth/verify-email", json={
            "user_id": user_id,
            "otp_code": "123456"  # Test fallback OTP code
        })
        assert otp_res.status_code == 200, otp_res.text

        # 3. Login
        login_res = await client.post("/api/v1/auth/login", json={
            "email": email,
            "password": password
        })
        assert login_res.status_code == 200, login_res.text
        tokens = login_res.json()
        access_token = tokens["access_token"]
        refresh_token = tokens["refresh_token"]

        headers = {"Authorization": f"Bearer {access_token}"}

        # 4. Access Protected Endpoint /me
        me_res = await client.get("/api/v1/users/me", headers=headers)
        assert me_res.status_code == 200
        assert me_res.json()["email"] == email

        # 5. Token Refresh
        ref_res = await client.post("/api/v1/auth/refresh", json={
            "refresh_token": refresh_token
        })
        assert ref_res.status_code == 200, ref_res.text
        new_tokens = ref_res.json()
        assert "access_token" in new_tokens

        # 6. Logout
        logout_res = await client.post("/api/v1/auth/logout", json={
            "refresh_token": refresh_token
        }, headers=headers)
        assert logout_res.status_code == 200
