"""
CharityAI – Receivers Router (Production Enterprise Receiver Engine)
Receiver registration, AI priority scoring, help request workflow, donation matching, and delivery confirmation.
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
from app.infrastructure.database.models.core import HelpRequest, HelpRequestStatus, ReceiverProfile
from app.infrastructure.database.models.donations import Donation, DonationStatus
from app.infrastructure.database.models.users import User, UserRole
from app.infrastructure.database.session import get_db
from app.presentation.dependencies.auth import get_current_user, require_admin, require_ngo_admin

router = APIRouter(prefix="/receivers", tags=["Receivers"])


def _calculate_ai_priority(family_size: int = 1, income: float = 0.0, urgency: str = "normal") -> float:
    """Calculate AI Priority score (0.0 to 100.0)."""
    score = 50.0
    if family_size > 4:
        score += 15.0
    elif family_size > 2:
        score += 10.0

    if income <= 5000:
        score += 25.0
    elif income <= 15000:
        score += 15.0

    if urgency == "critical":
        score += 20.0
    elif urgency == "high":
        score += 10.0

    return min(score, 100.0)


# ── 1. GET /receivers/profile/me ─────────────────────────────────────────────
@router.get(
    "/profile/me",
    summary="Get current user receiver profile",
)
async def get_my_receiver_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(ReceiverProfile)
        .options(selectinload(ReceiverProfile.help_requests))
        .where(ReceiverProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise NotFoundException("Receiver profile not found.")

    return {
        "id": str(profile.id),
        "user_id": str(profile.user_id),
        "family_size": profile.family_size,
        "monthly_income": profile.monthly_income,
        "income_category": profile.income_category,
        "housing_status": profile.housing_status,
        "primary_language": profile.primary_language,
        "special_needs": profile.special_needs,
        "ai_priority_score": profile.ai_priority_score,
        "is_verified": profile.is_verified,
        "help_requests_count": len(profile.help_requests or []),
        "created_at": profile.created_at.isoformat() if profile.created_at else None,
    }


# ── 2. POST /receivers/profile ───────────────────────────────────────────────
@router.post(
    "/profile",
    status_code=status.HTTP_201_CREATED,
    summary="Create or update receiver profile with AI priority scoring",
)
async def create_receiver_profile(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(ReceiverProfile).where(ReceiverProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()

    family_size = payload.get("family_size", 1)
    monthly_income = payload.get("monthly_income", 0.0)
    ai_score = _calculate_ai_priority(family_size, monthly_income)

    if not profile:
        profile = ReceiverProfile(
            user_id=current_user.id,
            family_size=family_size,
            monthly_income=monthly_income,
            income_category=payload.get("income_category", "below_poverty_line"),
            housing_status=payload.get("housing_status", "rented"),
            primary_language=payload.get("primary_language", "en"),
            special_needs=payload.get("special_needs", []),
            ai_priority_score=ai_score,
            created_by=str(current_user.id),
        )
        db.add(profile)
    else:
        profile.family_size = family_size
        profile.monthly_income = monthly_income
        profile.income_category = payload.get("income_category", profile.income_category)
        profile.housing_status = payload.get("housing_status", profile.housing_status)
        profile.primary_language = payload.get("primary_language", profile.primary_language)
        profile.special_needs = payload.get("special_needs", profile.special_needs)
        profile.ai_priority_score = ai_score

    await db.commit()
    return {
        "profile_id": str(profile.id),
        "ai_priority_score": profile.ai_priority_score,
        "message": "Receiver profile saved successfully.",
    }


# ── 3. POST /receivers/help-requests ─────────────────────────────────────────
@router.post(
    "/help-requests",
    status_code=status.HTTP_201_CREATED,
    summary="Submit help request with urgency & AI scoring",
)
async def create_help_request(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(ReceiverProfile).where(ReceiverProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        profile = ReceiverProfile(
            user_id=current_user.id,
            family_size=1,
            monthly_income=0.0,
            ai_priority_score=60.0,
            created_by=str(current_user.id),
        )
        db.add(profile)
        await db.flush()

    urgency = payload.get("urgency_level", "normal")
    ai_score = _calculate_ai_priority(profile.family_size or 1, profile.monthly_income or 0.0, urgency)

    help_req = HelpRequest(
        receiver_id=profile.id,
        need_type=payload.get("need_type", "food"),
        title=payload.get("title", "Request for Assistance"),
        description=payload.get("description", ""),
        urgency_level=urgency,
        quantity_needed=payload.get("quantity_needed", "1 kit"),
        status=HelpRequestStatus.SUBMITTED,
        ai_priority_score=ai_score,
        created_by=str(current_user.id),
    )
    db.add(help_req)
    await db.commit()

    return {
        "request_id": str(help_req.id),
        "status": help_req.status,
        "ai_priority_score": help_req.ai_priority_score,
        "created_at": help_req.created_at.isoformat() if help_req.created_at else None,
    }


# ── 4. GET /receivers/help-requests ─────────────────────────────────────────
@router.get(
    "/help-requests",
    summary="List help requests with filtering",
)
async def list_help_requests(
    status_filter: Optional[HelpRequestStatus] = None,
    need_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    query = select(HelpRequest).where(HelpRequest.is_deleted == False)

    # For receiver users: restrict view to their own requests
    if current_user.role not in (UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.NGO_ADMIN):
        profile_res = await db.execute(
            select(ReceiverProfile).where(ReceiverProfile.user_id == current_user.id)
        )
        profile = profile_res.scalar_one_or_none()
        if not profile:
            return {"total": 0, "page": page, "page_size": page_size, "items": []}
        query = query.where(HelpRequest.receiver_id == profile.id)

    if status_filter:
        query = query.where(HelpRequest.status == status_filter)
    if need_type:
        query = query.where(HelpRequest.need_type == need_type)

    total_res = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_res.scalar_one()

    query = query.order_by(HelpRequest.ai_priority_score.desc(), HelpRequest.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    requests = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            {
                "id": str(r.id),
                "receiver_id": str(r.receiver_id),
                "need_type": r.need_type,
                "title": r.title,
                "description": r.description,
                "status": r.status,
                "urgency_level": r.urgency_level,
                "quantity_needed": r.quantity_needed,
                "ai_priority_score": r.ai_priority_score,
                "matched_donation_id": str(r.matched_donation_id) if r.matched_donation_id else None,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in requests
        ],
    }


# ── 5. POST /receivers/help-requests/{request_id}/match ──────────────────────
@router.post(
    "/help-requests/{request_id}/match",
    summary="Match help request with an available donation",
)
async def match_help_request(
    request_id: uuid.UUID,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(HelpRequest).where(HelpRequest.id == request_id))
    req = result.scalar_one_or_none()
    if not req:
        raise NotFoundException("Help request not found.")

    donation_id = uuid.UUID(payload["donation_id"])
    don_res = await db.execute(select(Donation).where(Donation.id == donation_id))
    donation = don_res.scalar_one_or_none()
    if not donation:
        raise NotFoundException("Donation not found.")

    req.matched_donation_id = donation.id
    req.status = HelpRequestStatus.IN_PROGRESS
    donation.status = DonationStatus.IN_TRANSIT

    await db.commit()
    return {
        "request_id": str(request_id),
        "matched_donation_id": str(donation_id),
        "status": req.status,
        "message": "Help request matched with donation successfully.",
    }


# ── 6. PATCH /receivers/help-requests/{request_id}/approve ───────────────────
@router.patch(
    "/help-requests/{request_id}/approve",
    summary="Approve or reject help request (NGO/Admin)",
)
async def approve_request(
    request_id: uuid.UUID,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(HelpRequest).where(HelpRequest.id == request_id))
    req = result.scalar_one_or_none()
    if not req:
        raise NotFoundException("Help request not found.")

    action = payload.get("action", "approve")
    if action == "approve":
        req.status = HelpRequestStatus.APPROVED
        req.approved_by = str(current_user.id)
        req.approved_at = datetime.now(UTC)
    elif action == "reject":
        req.status = HelpRequestStatus.REJECTED
        req.rejection_reason = payload.get("reason", "Criteria not met.")

    await db.commit()
    return {"request_id": str(request_id), "status": req.status}


# ── 7. POST /receivers/help-requests/{request_id}/confirm-delivery ─────────
@router.post(
    "/help-requests/{request_id}/confirm-delivery",
    summary="Confirm fulfillment/delivery of help request",
)
async def confirm_delivery(
    request_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(HelpRequest).where(HelpRequest.id == request_id))
    req = result.scalar_one_or_none()
    if not req:
        raise NotFoundException("Help request not found.")

    req.status = HelpRequestStatus.FULFILLED
    req.fulfilled_at = datetime.now(UTC)

    if req.matched_donation_id:
        don_res = await db.execute(select(Donation).where(Donation.id == req.matched_donation_id))
        don = don_res.scalar_one_or_none()
        if don:
            don.status = DonationStatus.DISTRIBUTED

    await db.commit()
    return {
        "request_id": str(request_id),
        "status": req.status,
        "fulfilled_at": req.fulfilled_at.isoformat(),
        "message": "Delivery confirmed and request fulfilled.",
    }
