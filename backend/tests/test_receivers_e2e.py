"""
CharityAI – Full Production Receiver System E2E Test Suite (PostgreSQL)
"""
import uuid
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.mark.asyncio
async def test_receiver_system_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Register & login receiver user
        email = f"receiver_{uuid.uuid4().hex[:6]}@charityai.org"
        password = "Password123!"
        reg = await client.post("/api/v1/auth/register", json={
            "first_name": "Receiver",
            "last_name": "User",
            "email": email,
            "password": password,
            "role": "receiver"
        })
        assert reg.status_code == 201
        user_id = reg.json()["user_id"]

        await client.post("/api/v1/auth/verify-email", json={"user_id": user_id, "otp_code": "123456"})

        login = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Create Receiver Profile
        prof_res = await client.post("/api/v1/receivers/profile", json={
            "family_size": 5,
            "monthly_income": 4000.0,
            "income_category": "below_poverty_line",
            "housing_status": "temporary_shelter",
            "primary_language": "en"
        }, headers=headers)
        assert prof_res.status_code == 201
        assert prof_res.json()["ai_priority_score"] >= 80.0

        # 2. Get Profile
        me_res = await client.get("/api/v1/receivers/profile/me", headers=headers)
        assert me_res.status_code == 200
        assert me_res.json()["family_size"] == 5

        # 3. Create Help Request
        req_res = await client.post("/api/v1/receivers/help-requests", json={
            "need_type": "food",
            "title": "Emergency Food Relief Needed",
            "description": "Urgent ration kit required for family",
            "urgency_level": "critical",
            "quantity_needed": "1 ration kit"
        }, headers=headers)
        assert req_res.status_code == 201
        request_id = req_res.json()["request_id"]

        # 4. List Help Requests
        list_res = await client.get("/api/v1/receivers/help-requests", headers=headers)
        assert list_res.status_code == 200
        assert list_res.json()["total"] >= 1

        # 5. Approve Help Request
        appr_res = await client.patch(f"/api/v1/receivers/help-requests/{request_id}/approve", json={"action": "approve"}, headers=headers)
        assert appr_res.status_code == 200
        assert appr_res.json()["status"] == "approved"

        # 6. Create donation & match
        donor_login = await client.post("/api/v1/auth/login", json={"email": "donor@test.com", "password": "Donor@123456"})
        donor_headers = {"Authorization": f"Bearer {donor_login.json()['access_token']}"}
        don_res = await client.post("/api/v1/donations", json={
            "donation_type": "food",
            "title": "Matchable Food Pack",
            "amount": 1000.0
        }, headers=donor_headers)
        donation_id = don_res.json()["donation_id"]

        match_res = await client.post(f"/api/v1/receivers/help-requests/{request_id}/match", json={"donation_id": donation_id}, headers=headers)
        assert match_res.status_code == 200
        assert match_res.json()["matched_donation_id"] == donation_id

        # 7. Confirm Delivery
        conf_res = await client.post(f"/api/v1/receivers/help-requests/{request_id}/confirm-delivery", headers=headers)
        assert conf_res.status_code == 200
        assert conf_res.json()["status"] == "fulfilled"
