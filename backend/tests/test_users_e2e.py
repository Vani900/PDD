"""
CharityAI – Full Production User Management E2E Test Suite (PostgreSQL)
"""
import uuid
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.mark.asyncio
async def test_user_management_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Register user
        email = f"um_test_{uuid.uuid4().hex[:6]}@charityai.org"
        password = "Password123!"
        reg = await client.post("/api/v1/auth/register", json={
            "first_name": "Profile",
            "last_name": "Tester",
            "email": email,
            "password": password
        })
        assert reg.status_code == 201
        user_id = reg.json()["user_id"]

        # Activate user
        await client.post("/api/v1/auth/verify-email", json={"user_id": user_id, "otp_code": "123456"})

        # Login
        login = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. GET /me (Completion percentage)
        me_res = await client.get("/api/v1/users/me", headers=headers)
        assert me_res.status_code == 200
        me_data = me_res.json()
        assert "completion_percentage" in me_data
        assert me_data["email"] == email

        # 2. PUT /me (Edit Profile & Address)
        edit_res = await client.put("/api/v1/users/me", json={
            "first_name": "UpdatedFirst",
            "last_name": "UpdatedLast",
            "bio": "Charity supporter in Bangalore",
            "city": "Bangalore",
            "country": "India"
        }, headers=headers)
        assert edit_res.status_code == 200

        # Verify profile updated
        me_after_edit = await client.get("/api/v1/users/me", headers=headers)
        assert me_after_edit.json()["first_name"] == "UpdatedFirst"
        assert me_after_edit.json()["city"] == "Bangalore"

        # 3. POST /avatar
        avatar_res = await client.post("/api/v1/users/avatar", json={"avatar_url": "https://example.com/avatar.jpg"}, headers=headers)
        assert avatar_res.status_code == 200

        # 4. PUT & GET /preferences
        pref_res = await client.put("/api/v1/users/preferences", json={
            "email_notifications": True,
            "push_notifications": False,
            "sms_notifications": True,
            "public_profile": False
        }, headers=headers)
        assert pref_res.status_code == 200
        assert pref_res.json()["preferences"]["push_notifications"] == False

        # 5. GET /activity (Audit Trail)
        act_res = await client.get("/api/v1/users/activity", headers=headers)
        assert act_res.status_code == 200
        assert act_res.json()["total"] >= 1

        # 6. PUT /password
        new_password = "NewPassword123!"
        pass_res = await client.put("/api/v1/users/password", json={
            "current_password": password,
            "new_password": new_password
        }, headers=headers)
        assert pass_res.status_code == 200

        # Login with new password
        login_new = await client.post("/api/v1/auth/login", json={"email": email, "password": new_password})
        assert login_new.status_code == 200

        # 7. DELETE /me (Soft delete)
        del_res = await client.delete("/api/v1/users/me", headers=headers)
        assert del_res.status_code == 200

        # Admin Restore
        admin_login = await client.post("/api/v1/auth/login", json={"email": "admin@charityai.org", "password": "Admin@123456"})
        admin_token = admin_login.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        rest_res = await client.post("/api/v1/users/restore", params={"user_id": user_id}, headers=admin_headers)
        assert rest_res.status_code == 200
