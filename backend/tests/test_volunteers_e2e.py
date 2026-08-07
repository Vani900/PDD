"""
CharityAI – Full Production Volunteer System E2E Test Suite (PostgreSQL)
"""
import uuid
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.mark.asyncio
async def test_volunteer_system_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Register & login volunteer user
        email = f"vol_{uuid.uuid4().hex[:6]}@charityai.org"
        password = "Password123!"
        reg = await client.post("/api/v1/auth/register", json={
            "first_name": "Volunteer",
            "last_name": "Hero",
            "email": email,
            "password": password,
            "role": "volunteer"
        })
        assert reg.status_code == 201
        user_id = reg.json()["user_id"]

        await client.post("/api/v1/auth/verify-email", json={"user_id": user_id, "otp_code": "123456"})

        login = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Register as Volunteer
        vol_res = await client.post("/api/v1/volunteers/register", json={
            "skills": ["food_distribution", "logistics"],
            "languages": ["en", "hi"],
            "service_radius_km": 20.0
        }, headers=headers)
        assert vol_res.status_code == 201

        # 2. Get Profile
        prof_res = await client.get("/api/v1/volunteers/profile/me", headers=headers)
        assert prof_res.status_code == 200
        assert "food_distribution" in prof_res.json()["skills"]

        # 3. Create Task
        task_res = await client.post("/api/v1/volunteers/tasks", json={
            "title": "Deliver Food Packs to Shelter",
            "task_type": "delivery",
            "points_earned": 100
        }, headers=headers)
        assert task_res.status_code == 201
        task_id = task_res.json()["task_id"]

        # 4. Accept Task
        acc_res = await client.patch(f"/api/v1/volunteers/tasks/{task_id}/accept", headers=headers)
        assert acc_res.status_code == 200
        assert acc_res.json()["status"] == "assigned"

        # 5. Check in
        chin_res = await client.post(f"/api/v1/volunteers/tasks/{task_id}/checkin", headers=headers)
        assert chin_res.status_code == 200
        assert chin_res.json()["status"] == "in_progress"

        # 6. Complete Task
        comp_res = await client.post(f"/api/v1/volunteers/tasks/{task_id}/complete", json={"notes": "Delivered on time"}, headers=headers)
        assert comp_res.status_code == 200
        assert comp_res.json()["status"] == "completed"

        # 7. Update GPS Location
        loc_res = await client.post("/api/v1/volunteers/location", json={"latitude": 12.9716, "longitude": 77.5946}, headers=headers)
        assert loc_res.status_code == 200

        # 8. Leaderboard
        lb_res = await client.get("/api/v1/volunteers/leaderboard")
        assert lb_res.status_code == 200
        assert len(lb_res.json()["items"]) >= 1
