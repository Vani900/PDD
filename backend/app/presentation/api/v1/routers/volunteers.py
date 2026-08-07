"""
CharityAI – Volunteers Router (Production Enterprise Volunteer Engine)
Volunteer registration, task assignment, check-in, completion, location tracking, reward points, and leaderboard.
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundException, ValidationException
from app.infrastructure.database.models.core import TaskStatus, Volunteer, VolunteerTask
from app.infrastructure.database.models.users import User, UserRole
from app.infrastructure.database.session import get_db
from app.presentation.dependencies.auth import get_current_user, require_admin

router = APIRouter(prefix="/volunteers", tags=["Volunteers"])


# ── 1. GET /volunteers/profile/me ────────────────────────────────────────────
@router.get(
    "/profile/me",
    summary="Get current volunteer profile",
)
async def get_my_volunteer_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(Volunteer).where(Volunteer.user_id == current_user.id)
    )
    volunteer = result.scalar_one_or_none()
    if not volunteer:
        raise NotFoundException("Volunteer profile not found.")

    return _serialize_volunteer(volunteer)


# ── 2. POST /volunteers/register ─────────────────────────────────────────────
@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    summary="Register as volunteer",
)
async def register_volunteer(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(Volunteer).where(Volunteer.user_id == current_user.id)
    )
    volunteer = result.scalar_one_or_none()

    if not volunteer:
        volunteer = Volunteer(
            user_id=current_user.id,
            skills=payload.get("skills", ["logistics", "food_distribution"]),
            languages=payload.get("languages", ["en"]),
            availability=payload.get("availability", {"weekdays": True, "weekends": True}),
            service_radius_km=payload.get("service_radius_km", 15.0),
            rank="Community Hero",
            created_by=str(current_user.id),
        )
        db.add(volunteer)
    else:
        volunteer.skills = payload.get("skills", volunteer.skills)
        volunteer.languages = payload.get("languages", volunteer.languages)
        volunteer.service_radius_km = payload.get("service_radius_km", volunteer.service_radius_km)

    await db.commit()
    return {
        "volunteer_id": str(volunteer.id),
        "message": "Volunteer registered successfully.",
    }


# ── 3. POST /volunteers/tasks ────────────────────────────────────────────────
@router.post(
    "/tasks",
    status_code=status.HTTP_201_CREATED,
    summary="Create or assign a volunteer task",
)
async def create_task(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    vol_id = payload.get("volunteer_id")
    if not vol_id:
        vol_res = await db.execute(
            select(Volunteer).where(Volunteer.user_id == current_user.id)
        )
        vol = vol_res.scalar_one_or_none()
        if not vol:
            vol = Volunteer(user_id=current_user.id, created_by=str(current_user.id))
            db.add(vol)
            await db.flush()
        vol_id = str(vol.id)

    task = VolunteerTask(
        volunteer_id=uuid.UUID(vol_id),
        donation_id=uuid.UUID(payload["donation_id"]) if payload.get("donation_id") else None,
        title=payload.get("title", "Food Package Pickup & Delivery"),
        description=payload.get("description", "Pick up food donation and deliver to receiver shelter"),
        task_type=payload.get("task_type", "delivery"),
        priority=payload.get("priority", "medium"),
        status=TaskStatus.OPEN,
        points_earned=payload.get("points_earned", 50),
        created_by=str(current_user.id),
    )
    db.add(task)
    await db.commit()

    return {
        "task_id": str(task.id),
        "volunteer_id": str(task.volunteer_id),
        "status": task.status,
        "created_at": task.created_at.isoformat() if task.created_at else None,
    }


# ── 4. GET /volunteers/tasks ─────────────────────────────────────────────────
@router.get(
    "/tasks",
    summary="Get volunteer tasks with filters",
)
async def get_my_tasks(
    task_status: Optional[TaskStatus] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    vol_result = await db.execute(
        select(Volunteer).where(Volunteer.user_id == current_user.id)
    )
    volunteer = vol_result.scalar_one_or_none()
    if not volunteer:
        return {"total": 0, "page": page, "page_size": page_size, "items": []}

    query = select(VolunteerTask).where(VolunteerTask.volunteer_id == volunteer.id, VolunteerTask.is_deleted == False)
    if task_status:
        query = query.where(VolunteerTask.status == task_status)

    total = await db.execute(select(func.count()).select_from(query.subquery()))
    query = query.order_by(VolunteerTask.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    tasks = result.scalars().all()

    return {
        "total": total.scalar_one(),
        "page": page,
        "page_size": page_size,
        "items": [_serialize_task(t) for t in tasks],
    }


# ── 5. PATCH /volunteers/tasks/{task_id}/accept ──────────────────────────────
@router.patch(
    "/tasks/{task_id}/accept",
    summary="Accept a volunteer task",
)
async def accept_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(VolunteerTask).where(VolunteerTask.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise NotFoundException("Task not found.")

    task.status = TaskStatus.ASSIGNED
    await db.commit()

    return {"task_id": str(task_id), "status": task.status}


# ── 6. POST /volunteers/tasks/{task_id}/checkin ──────────────────────────────
@router.post(
    "/tasks/{task_id}/checkin",
    summary="Check in to task at pickup location",
)
async def task_checkin(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(VolunteerTask).where(VolunteerTask.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise NotFoundException("Task not found.")

    task.checked_in_at = datetime.now(UTC)
    task.status = TaskStatus.IN_PROGRESS
    await db.commit()

    return {"message": "Checked in successfully.", "task_id": str(task_id), "status": task.status}


# ── 7. POST /volunteers/tasks/{task_id}/complete ─────────────────────────────
@router.post(
    "/tasks/{task_id}/complete",
    summary="Complete task, award reward points, and update volunteer stats",
)
async def complete_task(
    task_id: uuid.UUID,
    payload: Optional[dict] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(VolunteerTask)
        .options(selectinload(VolunteerTask.volunteer))
        .where(VolunteerTask.id == task_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise NotFoundException("Task not found.")

    task.status = TaskStatus.COMPLETED
    task.completed_at = datetime.now(UTC)
    task.volunteer_notes = payload.get("notes") if payload else "Completed successfully."

    # Update Volunteer aggregate statistics in PostgreSQL
    vol = task.volunteer
    if vol:
        vol.total_tasks_completed += 1
        vol.total_hours += 1.5
        vol.rating = min(5.0, (vol.rating * vol.rating_count + 5.0) / (vol.rating_count + 1)) if vol.rating_count > 0 else 5.0
        vol.rating_count += 1

    await db.commit()

    return {
        "message": "Task completed successfully!",
        "task_id": str(task_id),
        "status": task.status,
        "points_earned": task.points_earned,
        "completed_at": task.completed_at.isoformat(),
    }


# ── 8. POST /volunteers/location ─────────────────────────────────────────────
@router.post(
    "/location",
    summary="Update real-time volunteer GPS location",
)
async def update_location(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    vol_res = await db.execute(
        select(Volunteer).where(Volunteer.user_id == current_user.id)
    )
    vol = vol_res.scalar_one_or_none()
    if not vol:
        raise NotFoundException("Volunteer profile not found.")

    vol.current_latitude = payload.get("latitude")
    vol.current_longitude = payload.get("longitude")
    await db.commit()

    return {
        "message": "Location updated successfully.",
        "latitude": vol.current_latitude,
        "longitude": vol.current_longitude,
    }


# ── 9. GET /volunteers/leaderboard ───────────────────────────────────────────
@router.get(
    "/leaderboard",
    summary="Top volunteer leaderboard",
)
async def leaderboard(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(Volunteer)
        .where(Volunteer.is_deleted == False, Volunteer.is_active == True)
        .order_by(Volunteer.total_tasks_completed.desc(), Volunteer.rating.desc())
        .limit(limit)
    )
    volunteers = result.scalars().all()
    return {"items": [_serialize_volunteer(v) for v in volunteers]}


def _serialize_volunteer(v: Volunteer) -> dict:
    return {
        "id": str(v.id),
        "user_id": str(v.user_id),
        "skills": v.skills or [],
        "rating": v.rating,
        "total_tasks_completed": v.total_tasks_completed,
        "total_hours": v.total_hours,
        "rank": v.rank,
        "is_active": v.is_active,
    }


def _serialize_task(t: VolunteerTask) -> dict:
    return {
        "id": str(t.id),
        "title": t.title,
        "task_type": t.task_type,
        "status": t.status,
        "priority": t.priority,
        "scheduled_at": t.scheduled_at.isoformat() if t.scheduled_at else None,
        "points_earned": t.points_earned,
    }
