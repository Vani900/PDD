"""
CharityAI – NGO Requirements & Donation Matching API Tests
"""
import pytest
from httpx import AsyncClient
from fastapi import status

@pytest.mark.asyncio
async def test_ngo_requirements_flow(async_client: AsyncClient):
    # 1. Register donor
    donor_res = await async_client.post("/api/v1/auth/register", json={
        "first_name": "Test",
        "last_name": "Donor",
        "email": "testdonor_req@charityai.org",
        "password": "Password123!",
        "role": "donor"
    })
    assert donor_res.status_code == 201

    donor_login = await async_client.post("/api/v1/auth/login", json={
        "email": "testdonor_req@charityai.org",
        "password": "Password123!"
    })
    assert donor_login.status_code == 200
    donor_token = donor_login.json()["access_token"]
    donor_headers = {"Authorization": f"Bearer {donor_token}"}

    # 2. Register NGO
    ngo_res = await async_client.post("/api/v1/auth/register", json={
        "first_name": "NGO",
        "last_name": "Admin",
        "email": "ngo_admin_req@charityai.org",
        "password": "Password123!",
        "role": "ngo_admin"
    })
    assert ngo_res.status_code == 201

    ngo_login = await async_client.post("/api/v1/auth/login", json={
        "email": "ngo_admin_req@charityai.org",
        "password": "Password123!"
    })
    assert ngo_login.status_code == 200
    ngo_token = ngo_login.json()["access_token"]
    ngo_headers = {"Authorization": f"Bearer {ngo_token}"}

    # 3. Donor creates donation
    don_res = await async_client.post("/api/v1/donations", headers=donor_headers, json={
        "donation_type": "food",
        "title": "20 kg Basmati Rice",
        "pickup_city": "Bangalore",
        "items": [{"name": "Rice", "quantity": 20}]
    })
    assert don_res.status_code == 201
    donation_id = don_res.json()["donation_id"]

    # 4. List public donations
    list_res = await async_client.get("/api/v1/donations")
    assert list_res.status_code == 200
    assert list_res.json()["total"] >= 1

    # 5. Get donor impact
    impact_res = await async_client.get("/api/v1/users/me/impact", headers=donor_headers)
    assert impact_res.status_code == 200
    assert impact_res.json()["total_donations"] >= 1
