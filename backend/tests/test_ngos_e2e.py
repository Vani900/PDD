"""
CharityAI – Full Production NGO System E2E Test Suite (PostgreSQL)
"""
import uuid
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.mark.asyncio
async def test_ngo_system_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login NGO admin user
        login = await client.post("/api/v1/auth/login", json={"email": "ngo@sarvam.org", "password": "NGO@123456"})
        assert login.status_code == 200
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Register NGO
        ngo_res = await client.post("/api/v1/ngos", json={
            "name": f"Sarvam Care Trust {uuid.uuid4().hex[:4]}",
            "description": "Providing education and food relief across South India.",
            "email": "contact@sarvamcare.org",
            "phone": "+919876543210",
            "city": "Bangalore",
            "country": "India"
        }, headers=headers)
        assert ngo_res.status_code == 201
        ngo_id = ngo_res.json()["ngo_id"]

        # 2. Get NGO Profile
        prof_res = await client.get(f"/api/v1/ngos/{ngo_id}")
        assert prof_res.status_code == 200
        assert prof_res.json()["city"] == "Bangalore"

        # 3. Update NGO Profile
        upd_res = await client.patch(f"/api/v1/ngos/{ngo_id}", json={
            "description": "Updated mission for rural empowerment."
        }, headers=headers)
        assert upd_res.status_code == 200

        # 4. Upload Verification Doc
        doc_res = await client.post(f"/api/v1/ngos/{ngo_id}/documents", json={
            "document_type": "registration_certificate",
            "file_url": "https://storage.charityai.org/docs/cert.pdf"
        }, headers=headers)
        assert doc_res.status_code == 201

        # 5. Verify NGO (Admin)
        admin_login = await client.post("/api/v1/auth/login", json={"email": "admin@charityai.org", "password": "Admin@123456"})
        admin_token = admin_login.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        ver_res = await client.post(f"/api/v1/ngos/{ngo_id}/verify", json={"action": "verify"}, headers=admin_headers)
        assert ver_res.status_code == 200
        assert ver_res.json()["status"] == "verified"

        # 6. Create Campaign
        camp_res = await client.post(f"/api/v1/ngos/{ngo_id}/campaigns", json={
            "title": "Winter Clothes Drive 2026",
            "campaign_type": "clothes_drive",
            "goal_amount": 100000.0
        }, headers=headers)
        assert camp_res.status_code == 201

        # 7. List Campaigns
        c_list_res = await client.get(f"/api/v1/ngos/{ngo_id}/campaigns")
        assert c_list_res.status_code == 200
        assert len(c_list_res.json()["items"]) >= 1

        # 8. NGO Analytics
        ana_res = await client.get(f"/api/v1/ngos/{ngo_id}/analytics", headers=headers)
        assert ana_res.status_code == 200
