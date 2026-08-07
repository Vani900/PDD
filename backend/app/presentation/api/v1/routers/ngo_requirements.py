"""
CharityAI – NGO Requirements & Donation Matching Router
Enables NGOs to create requirements and match with donor donations.
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.infrastructure.database.models.core import Notification
from app.infrastructure.database.models.donations import Donation, DonationType, DonationStatus
from app.infrastructure.database.models.organizations import (
    DonationMatch,
    MatchStatus,
    NGORequirement,
    Organization,
    OrganizationType,
    RequirementStatus,
    RequirementUrgency,
)
from app.infrastructure.database.models.users import User, UserRole
from app.infrastructure.database.session import get_db
from app.presentation.dependencies.auth import get_current_user, get_optional_current_user

router = APIRouter(prefix="/ngo-requirements", tags=["NGO Requirements & Matching"])


# ── 1. POST /ngo-requirements ─────────────────────────────────────────────────
@router.post("", status_code=status.HTTP_201_CREATED, summary="NGO creates a donation requirement")
async def create_requirement(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    # Find the NGO for this user
    ngo_result = await db.execute(
        select(Organization).where(
            Organization.org_type == OrganizationType.NGO,
            Organization.is_deleted == False,
        )
    )
    # Get NGO where the user is a member
    from app.infrastructure.database.models.organizations import OrganizationMember
    member_result = await db.execute(
        select(OrganizationMember).where(OrganizationMember.user_id == current_user.id)
    )
    member = member_result.scalar_one_or_none()

    if not member and current_user.role not in (UserRole.NGO_ADMIN, UserRole.NGO_STAFF, UserRole.SUPER_ADMIN, UserRole.ADMIN):
        raise HTTPException(status_code=403, detail={"message": "You must be an NGO member to create requirements."})

    ngo_id_str = payload.get("ngo_id")
    if ngo_id_str:
        ngo_id = uuid.UUID(ngo_id_str)
    elif member:
        ngo_id = member.organization_id
    else:
        raise HTTPException(status_code=400, detail={"message": "ngo_id is required."})

    req = NGORequirement(
        ngo_id=ngo_id,
        created_by_user_id=current_user.id,
        category=payload.get("category", "food"),
        item_name=payload.get("item_name", payload.get("item", "General Item")),
        quantity=payload.get("quantity"),
        unit=payload.get("unit"),
        description=payload.get("description"),
        city=payload.get("city", "Bangalore"),
        state=payload.get("state"),
        address=payload.get("address"),
        urgency=payload.get("urgency", RequirementUrgency.MEDIUM),
        status=RequirementStatus.OPEN,
        created_by=str(current_user.id),
    )
    db.add(req)
    await db.commit()

    return {
        "requirement_id": str(req.id),
        "status": req.status,
        "message": "Requirement created successfully. Matching donors will be notified.",
    }


# ── 2. GET /ngo-requirements ──────────────────────────────────────────────────
@router.get("", summary="List NGO requirements (public, filterable)")
async def list_requirements(
    category: Optional[str] = None,
    city: Optional[str] = None,
    urgency: Optional[str] = None,
    ngo_id: Optional[uuid.UUID] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    query = (
        select(NGORequirement)
        .options(selectinload(NGORequirement.ngo))
        .where(NGORequirement.is_deleted == False)
    )

    if category:
        query = query.where(NGORequirement.category == category)
    if city:
        query = query.where(NGORequirement.city.ilike(f"%{city}%"))
    if urgency:
        query = query.where(NGORequirement.urgency == urgency)
    if ngo_id:
        query = query.where(NGORequirement.ngo_id == ngo_id)
    if status_filter:
        query = query.where(NGORequirement.status == status_filter)
    else:
        # By default show open requirements
        query = query.where(NGORequirement.status.in_([RequirementStatus.OPEN, RequirementStatus.PARTIALLY_MATCHED]))

    from sqlalchemy import desc
    query = query.order_by(desc(NGORequirement.urgency), desc(NGORequirement.created_at))

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar_one()

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    requirements = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size if total > 0 else 1,
        "items": [_serialize_requirement(r) for r in requirements],
    }


# ── 3. GET /ngo-requirements/my ───────────────────────────────────────────────
@router.get("/my", summary="Get my NGO's requirements")
async def get_my_requirements(
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    from app.infrastructure.database.models.organizations import OrganizationMember
    member_result = await db.execute(
        select(OrganizationMember).where(OrganizationMember.user_id == current_user.id)
    )
    member = member_result.scalar_one_or_none()

    query = (
        select(NGORequirement)
        .options(selectinload(NGORequirement.ngo))
        .where(NGORequirement.is_deleted == False)
    )

    if member:
        query = query.where(NGORequirement.ngo_id == member.organization_id)
    else:
        query = query.where(NGORequirement.created_by_user_id == current_user.id)

    if status_filter:
        query = query.where(NGORequirement.status == status_filter)

    from sqlalchemy import desc
    query = query.order_by(desc(NGORequirement.created_at))

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar_one()

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    requirements = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "items": [_serialize_requirement(r) for r in requirements],
    }


# ── 4. GET /ngo-requirements/{req_id} ────────────────────────────────────────
@router.get("/{req_id}", summary="Get a specific requirement")
async def get_requirement(
    req_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(NGORequirement)
        .options(selectinload(NGORequirement.ngo))
        .where(NGORequirement.id == req_id, NGORequirement.is_deleted == False)
    )
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail={"message": "Requirement not found."})
    return _serialize_requirement(req, detailed=True)


# ── 5. POST /ngo-requirements/{req_id}/request-donation/{donation_id} ────────
@router.post(
    "/{req_id}/request-donation/{donation_id}",
    status_code=status.HTTP_201_CREATED,
    summary="NGO requests a specific donor donation",
)
async def request_donation(
    req_id: uuid.UUID,
    donation_id: uuid.UUID,
    payload: dict = {},
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    # Get the requirement
    req_result = await db.execute(
        select(NGORequirement).where(NGORequirement.id == req_id, NGORequirement.is_deleted == False)
    )
    req = req_result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail={"message": "Requirement not found."})

    # Get the donation
    don_result = await db.execute(
        select(Donation).where(Donation.id == donation_id, Donation.is_deleted == False)
    )
    donation = don_result.scalar_one_or_none()
    if not donation:
        raise HTTPException(status_code=404, detail={"message": "Donation not found."})

    if donation.status not in (DonationStatus.PENDING, DonationStatus.SCHEDULED):
        raise HTTPException(status_code=400, detail={"message": f"Donation is not available for matching (status: {donation.status})."})

    # Check for existing match
    existing_match = await db.execute(
        select(DonationMatch).where(
            DonationMatch.donation_id == donation_id,
            DonationMatch.ngo_id == req.ngo_id,
            DonationMatch.status.in_([MatchStatus.REQUESTED, MatchStatus.PENDING_DONOR, MatchStatus.ACCEPTED]),
        )
    )
    if existing_match.scalar_one_or_none():
        raise HTTPException(status_code=409, detail={"message": "A match request already exists for this donation from your NGO."})

    # Create match
    match = DonationMatch(
        donation_id=donation_id,
        requirement_id=req_id,
        ngo_id=req.ngo_id,
        donor_id=donation.donor_id,
        status=MatchStatus.PENDING_DONOR,
        request_message=payload.get("message", f"NGO requires {req.item_name} for community support."),
        requested_at=datetime.now(UTC),
        created_by=str(current_user.id),
    )
    db.add(match)

    # Update requirement status
    req.status = RequirementStatus.MATCHED

    # Notify the donor
    notification = Notification(
        user_id=donation.donor_id,
        title="NGO Interested in Your Donation! 🎉",
        body=f"An NGO has requested your donation '{donation.title}'. Log in to accept or decline.",
        notification_type="ngo_match_request",
        channel="in_app",
        entity_type="donation_match",
        entity_id=str(match.id),
        priority="high",
    )
    db.add(notification)

    await db.commit()

    return {
        "match_id": str(match.id),
        "status": match.status,
        "message": "Donation request sent to donor. They will be notified to accept or decline.",
    }


# ── 6. POST /ngo-requirements/matches/{match_id}/accept ──────────────────────
@router.post(
    "/matches/{match_id}/accept",
    summary="Donor accepts an NGO match request",
)
async def accept_match(
    match_id: uuid.UUID,
    payload: dict = {},
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    match_result = await db.execute(
        select(DonationMatch).where(DonationMatch.id == match_id, DonationMatch.is_deleted == False)
    )
    match = match_result.scalar_one_or_none()
    if not match:
        raise HTTPException(status_code=404, detail={"message": "Match request not found."})

    # Verify caller is the donor
    if match.donor_id != current_user.id:
        raise HTTPException(status_code=403, detail={"message": "Only the donor can accept this request."})

    if match.status != MatchStatus.PENDING_DONOR:
        raise HTTPException(status_code=400, detail={"message": f"Cannot accept match in status: {match.status}."})

    match.status = MatchStatus.ACCEPTED
    match.response_message = payload.get("message", "Donor has accepted your request.")
    match.responded_at = datetime.now(UTC)

    # Update donation status
    don_result = await db.execute(select(Donation).where(Donation.id == match.donation_id))
    donation = don_result.scalar_one_or_none()
    if donation:
        donation.status = DonationStatus.PICKUP_ARRANGED
        donation.ngo_id = match.ngo_id

    # Notify the NGO's admin user
    # Find NGO admin to notify
    from app.infrastructure.database.models.organizations import OrganizationMember
    members_result = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == match.ngo_id,
            OrganizationMember.role == "admin",
        )
    )
    members = members_result.scalars().all()
    for mem in members:
        notification = Notification(
            user_id=mem.user_id,
            title="Donation Accepted! ✅",
            body=f"A donor has accepted your request for '{donation.title if donation else 'donation'}'. Proceed to arrange pickup.",
            notification_type="donation_accepted",
            channel="in_app",
            entity_type="donation_match",
            entity_id=str(match.id),
            priority="high",
        )
        db.add(notification)

    await db.commit()

    return {
        "match_id": str(match.id),
        "status": match.status,
        "message": "Match accepted. The NGO will contact you for pickup arrangements.",
    }


# ── 7. POST /ngo-requirements/matches/{match_id}/reject ──────────────────────
@router.post(
    "/matches/{match_id}/reject",
    summary="Donor rejects an NGO match request",
)
async def reject_match(
    match_id: uuid.UUID,
    payload: dict = {},
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    match_result = await db.execute(
        select(DonationMatch).where(DonationMatch.id == match_id, DonationMatch.is_deleted == False)
    )
    match = match_result.scalar_one_or_none()
    if not match:
        raise HTTPException(status_code=404, detail={"message": "Match request not found."})

    if match.donor_id != current_user.id:
        raise HTTPException(status_code=403, detail={"message": "Only the donor can reject this request."})

    match.status = MatchStatus.REJECTED
    match.response_message = payload.get("message", "Donor declined this request.")
    match.responded_at = datetime.now(UTC)

    # Reset the requirement to OPEN so other donors can match
    if match.requirement_id:
        req_result = await db.execute(select(NGORequirement).where(NGORequirement.id == match.requirement_id))
        req = req_result.scalar_one_or_none()
        if req:
            req.status = RequirementStatus.OPEN

    await db.commit()
    return {"match_id": str(match.id), "status": match.status}


# ── 8. GET /ngo-requirements/matches/my ──────────────────────────────────────
@router.get("/matches/my", summary="Get match requests for current donor's donations")
async def get_my_matches(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(DonationMatch)
        .options(selectinload(DonationMatch.ngo))
        .where(
            DonationMatch.donor_id == current_user.id,
            DonationMatch.is_deleted == False,
        )
        .order_by(DonationMatch.created_at.desc())
        .limit(50)
    )
    matches = result.scalars().all()

    items = []
    for m in matches:
        # Get donation details
        don_result = await db.execute(select(Donation).where(Donation.id == m.donation_id))
        donation = don_result.scalar_one_or_none()

        items.append({
            "match_id": str(m.id),
            "donation_id": str(m.donation_id),
            "donation_title": donation.title if donation else "Unknown",
            "donation_type": donation.donation_type if donation else None,
            "ngo_id": str(m.ngo_id),
            "ngo_name": m.ngo.name if m.ngo else "Unknown NGO",
            "status": m.status,
            "request_message": m.request_message,
            "requested_at": m.requested_at.isoformat() if m.requested_at else None,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        })

    return {"total": len(items), "items": items}


# ── 9. GET /ngo-requirements/matching-donations ───────────────────────────────
@router.get(
    "/matching-donations",
    summary="Find donations that match open NGO requirements (for donor browsing)",
)
async def find_matching_donations(
    category: Optional[str] = None,
    city: Optional[str] = None,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Show donors which of their pending donations have matching NGO requirements."""
    if not current_user:
        # Public: just list open requirements with counts
        req_query = select(
            NGORequirement.category,
            func.count(NGORequirement.id).label("count"),
        ).where(
            NGORequirement.status == RequirementStatus.OPEN,
            NGORequirement.is_deleted == False,
        ).group_by(NGORequirement.category)

        result = await db.execute(req_query)
        return {"summary": [{"category": r.category, "open_requirements": r.count} for r in result.all()]}

    # For authenticated donors: find their donations with matching requirements
    donor_donations = await db.execute(
        select(Donation).where(
            Donation.donor_id == current_user.id,
            Donation.status == DonationStatus.PENDING,
            Donation.is_deleted == False,
        )
    )
    donations = donor_donations.scalars().all()

    results = []
    for donation in donations:
        # Find open requirements in same category and city
        req_query = (
            select(NGORequirement)
            .options(selectinload(NGORequirement.ngo))
            .where(
                NGORequirement.category == donation.donation_type,
                NGORequirement.status.in_([RequirementStatus.OPEN, RequirementStatus.PARTIALLY_MATCHED]),
                NGORequirement.is_deleted == False,
            )
        )
        if donation.pickup_city:
            req_query = req_query.where(
                or_(
                    NGORequirement.city.ilike(f"%{donation.pickup_city}%"),
                    NGORequirement.city == "Any",
                )
            )

        req_result = await db.execute(req_query.limit(5))
        matching_reqs = req_result.scalars().all()

        if matching_reqs:
            results.append({
                "donation": {
                    "id": str(donation.id),
                    "title": donation.title,
                    "type": donation.donation_type,
                    "city": donation.pickup_city,
                    "status": donation.status,
                    "tracking_number": donation.tracking_number,
                },
                "matching_requirements": [_serialize_requirement(r) for r in matching_reqs],
            })

    return {"total": len(results), "items": results}


def _serialize_requirement(r: NGORequirement, detailed: bool = False) -> dict:
    data: dict = {
        "id": str(r.id),
        "ngo_id": str(r.ngo_id),
        "ngo_name": r.ngo.name if r.ngo else "Unknown NGO",
        "ngo_city": r.ngo.city if r.ngo else None,
        "category": r.category,
        "item_name": r.item_name,
        "quantity": r.quantity,
        "unit": r.unit,
        "city": r.city,
        "urgency": r.urgency,
        "status": r.status,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }
    if detailed:
        data.update({
            "description": r.description,
            "state": r.state,
            "address": r.address,
            "needed_by": r.needed_by.isoformat() if r.needed_by else None,
        })
    return data
