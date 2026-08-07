"""
CharityAI – Full Production Corporate Portal E2E Test Suite (PostgreSQL)
"""
import uuid
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.mark.asyncio
async def test_corporate_portal_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Register & login corporate user
        email = f"corp_{uuid.uuid4().hex[:6]}@charityai.org"
        password = "Password123!"
        reg = await client.post("/api/v1/auth/register", json={
            "first_name": "Corp",
            "last_name": "Admin",
            "email": email,
            "password": password,
            "role": "corporate_csr"
        })
        assert reg.status_code == 201
        user_id = reg.json()["user_id"]

        await client.post("/api/v1/auth/verify-email", json={"user_id": user_id, "otp_code": "123456"})

        login = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Register Corporate Entity
        corp_res = await client.post("/api/v1/corporate/register", json={
            "company_name": "TechGlobal CSR Foundation",
            "description": "Investing 2% net profits in food & education drives.",
            "cin": f"U72200KA2020PTC{uuid.uuid4().hex[:6].upper()}",
            "city": "Bangalore",
            "country": "India"
        }, headers=headers)
        assert corp_res.status_code == 201
        org_id = corp_res.json()["organization_id"]

        # 2. Bulk Donations
        bulk_res = await client.post("/api/v1/corporate/bulk-donations", json={
            "donations": [
                {"title": "School Kit Drive", "amount": 100000.0, "donation_type": "education"},
                {"title": "Disaster Food Relief", "amount": 250000.0, "donation_type": "food"}
            ]
        }, headers=headers)
        assert bulk_res.status_code == 201
        assert len(bulk_res.json()["donation_ids"]) == 2

        # 3. Get CSR Dashboard
        dash_res = await client.get("/api/v1/corporate/dashboard", headers=headers)
        assert dash_res.status_code == 200
        assert dash_res.json()["total_donated"] >= 350000.0

        # 4. Create Campaign
        camp_res = await client.post("/api/v1/corporate/campaigns", json={
            "organization_id": org_id,
            "title": "Clean Water Initiative 2026",
            "goal_amount": 500000.0
        }, headers=headers)
        assert camp_res.status_code == 201

        # 5. CSR Report
        rep_res = await client.get("/api/v1/corporate/csr-report/2026", headers=headers)
        assert rep_res.status_code == 200
        assert rep_res.json()["total_amount"] >= 350000.0
