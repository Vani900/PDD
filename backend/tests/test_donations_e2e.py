"""
CharityAI – Full Production Donation System E2E Test Suite (PostgreSQL)
"""
import uuid
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.mark.asyncio
async def test_donation_system_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Login donor user
        login_res = await client.post("/api/v1/auth/login", json={"email": "donor@test.com", "password": "Donor@123456"})
        assert login_res.status_code == 200, login_res.text
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Create Donation
        don_payload = {
            "donation_type": "food",
            "title": "E2E Food Relief Package",
            "description": "20 Ration Kits for disaster relief",
            "amount": 5000.0,
            "currency": "INR",
            "pickup_address": "MG Road, Bangalore",
            "pickup_city": "Bangalore",
            "items": [
                {"name": "Rice (10kg)", "quantity": 20, "unit": "bags", "condition": "new"},
                {"name": "Dal (2kg)", "quantity": 20, "unit": "packets", "condition": "new"}
            ]
        }
        create_res = await client.post("/api/v1/donations", json=don_payload, headers=headers)
        assert create_res.status_code == 201, create_res.text
        don_data = create_res.json()
        donation_id = don_data["donation_id"]
        tracking_number = don_data["tracking_number"]
        assert tracking_number.startswith("DON-")

        # 3. List Donations
        list_res = await client.get("/api/v1/donations?donation_type=food", headers=headers)
        assert list_res.status_code == 200
        assert list_res.json()["total"] >= 1

        # 4. Get Donation Detail
        detail_res = await client.get(f"/api/v1/donations/{donation_id}", headers=headers)
        assert detail_res.status_code == 200
        det = detail_res.json()
        assert det["title"] == "E2E Food Relief Package"
        assert len(det["items"]) == 2

        # 5. Get QR Code
        qr_res = await client.get(f"/api/v1/donations/{donation_id}/qr", headers=headers)
        assert qr_res.status_code == 200
        assert "qr_code_base64" in qr_res.json()

        # 6. Update Status
        status_res = await client.put(f"/api/v1/donations/{donation_id}/status", json={
            "status": "approved",
            "notes": "Verified by NGO team"
        }, headers=headers)
        assert status_res.status_code == 200
        assert status_res.json()["new_status"] == "approved"

        # 7. Verify QR scan
        verify_res = await client.post(f"/api/v1/donations/{donation_id}/verify-qr", headers=headers)
        assert verify_res.status_code == 200
        assert verify_res.json()["message"] == "Donation QR code verified successfully."
