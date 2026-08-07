"""
CharityAI – NGO Router (Production Enterprise NGO Engine)
Organization registration, verification, KYC documents, campaigns, warehouse inventory, analytics.
"""
from __future__ import annotations

import re
import uuid
from datetime import UTC, datetime
from typing import Annotated, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Query, UploadFile, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import InsufficientPermissionsException, NGONotFoundException
from app.infrastructure.database.models.organizations import (
    Campaign,
    CampaignStatus,
    CampaignType,
    Organization,
    OrganizationDocument,
    OrganizationMember,
    OrganizationStatus,
    OrganizationType,
)
from app.infrastructure.database.models.users import User, UserRole, VerificationStatus
from app.infrastructure.database.session import get_db
from app.presentation.dependencies.auth import get_current_user, get_optional_current_user, require_admin

router = APIRouter(prefix="/ngos", tags=["NGOs"])


# ── 1. GET /ngos ─────────────────────────────────────────────────────────────
@router.get("", summary="Discover NGOs with search and filters")
async def list_ngos(
    search: Optional[str] = None,
    city: Optional[str] = None,
    country: Optional[str] = None,
    category: Optional[str] = None,
    is_verified: bool = True,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("rating", pattern="^(rating|total_received|followers_count|name)$"),
    db: AsyncSession = Depends(get_db),
) -> dict:
    query = (
        select(Organization)
        .where(
            Organization.is_deleted == False,
            Organization.org_type == OrganizationType.NGO,
        )
    )
    if is_verified:
        query = query.where(Organization.verification_status == VerificationStatus.VERIFIED)
    if search:
        query = query.where(
            or_(
                Organization.name.ilike(f"%{search}%"),
                Organization.description.ilike(f"%{search}%"),
            )
        )
    if city:
        query = query.where(Organization.city.ilike(f"%{city}%"))
    if country:
        query = query.where(Organization.country.ilike(f"%{country}%"))

    total = await db.execute(select(func.count()).select_from(query.subquery()))
    total_count = total.scalar_one()

    from sqlalchemy import desc
    order_col = getattr(Organization, sort_by, Organization.rating)
    query = query.order_by(desc(order_col)).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    ngos = result.scalars().all()

    return {
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "pages": (total_count + page_size - 1) // page_size if total_count > 0 else 1,
        "items": [_serialize_ngo(n) for n in ngos],
    }


# ── 2. POST /ngos ────────────────────────────────────────────────────────────
@router.post("", status_code=status.HTTP_201_CREATED, summary="Register an NGO")
async def register_ngo(
    payload: dict,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    raw_slug = re.sub(r"[^a-z0-9-]", "-", payload.get("name", "ngo").lower().strip())
    slug = f"{raw_slug}-{uuid.uuid4().hex[:4]}"

    org = Organization(
        org_type=OrganizationType.NGO,
        status=OrganizationStatus.PENDING,
        verification_status=VerificationStatus.PENDING,
        name=payload.get("name", "Sample NGO"),
        slug=slug,
        description=payload.get("description", "Dedicated to community welfare."),
        email=payload.get("email", current_user.email),
        phone=payload.get("phone", current_user.phone),
        city=payload.get("city", "Bangalore"),
        country=payload.get("country", "India"),
        registration_number=payload.get("registration_number", f"REG-{uuid.uuid4().hex[:6].upper()}"),
        created_by=str(current_user.id),
    )
    db.add(org)
    await db.flush()

    # Add creator as NGO admin
    member = OrganizationMember(
        organization_id=org.id,
        user_id=current_user.id,
        role="admin",
        is_primary_contact=True,
    )
    db.add(member)
    await db.commit()

    return {"ngo_id": str(org.id), "slug": slug, "status": org.status, "message": "NGO registration submitted."}


# ── 3. GET /ngos/{ngo_id} ────────────────────────────────────────────────────
@router.get("/{ngo_id}", summary="Get NGO profile details")
async def get_ngo(
    ngo_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(Organization)
        .options(
            selectinload(Organization.campaigns),
            selectinload(Organization.members),
        )
        .where(Organization.id == ngo_id, Organization.is_deleted == False)
    )
    ngo = result.scalar_one_or_none()
    if not ngo:
        raise NGONotFoundException()
    return _serialize_ngo(ngo, detailed=True)


# ── 4. PATCH /ngos/{ngo_id} ──────────────────────────────────────────────────
@router.patch("/{ngo_id}", summary="Update NGO profile")
async def update_ngo(
    ngo_id: uuid.UUID,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(Organization).where(Organization.id == ngo_id))
    ngo = result.scalar_one_or_none()
    if not ngo:
        raise NGONotFoundException()

    updatable = [
        "description", "mission", "vision", "phone", "website",
        "social_links", "categories", "tags", "logo_url", "banner_url"
    ]
    for field in updatable:
        if field in payload:
            setattr(ngo, field, payload[field])

    ngo.updated_by = str(current_user.id)
    await db.commit()
    return {"ngo_id": str(ngo.id), "message": "NGO profile updated successfully."}


# ── 5. POST /ngos/{ngo_id}/verify ────────────────────────────────────────────
@router.post("/{ngo_id}/verify", summary="Approve/verify NGO (Admin only)")
async def verify_ngo(
    ngo_id: uuid.UUID,
    payload: dict,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(Organization).where(Organization.id == ngo_id))
    ngo = result.scalar_one_or_none()
    if not ngo:
        raise NGONotFoundException()

    action = payload.get("action", "verify")
    if action == "verify":
        ngo.verification_status = VerificationStatus.VERIFIED
        ngo.status = OrganizationStatus.VERIFIED
        ngo.verified_at = datetime.now(UTC)
        ngo.verified_by = str(current_user.id)
        ngo.kyc_completed = True
    elif action == "reject":
        ngo.verification_status = VerificationStatus.REJECTED
        ngo.status = OrganizationStatus.REJECTED
        ngo.rejection_reason = payload.get("reason", "Documents incomplete.")

    await db.commit()
    return {"ngo_id": str(ngo_id), "status": ngo.verification_status}


# ── 6. POST /ngos/{ngo_id}/documents ─────────────────────────────────────────
@router.post("/{ngo_id}/documents", status_code=status.HTTP_201_CREATED, summary="Upload NGO legal verification document")
async def upload_ngo_document(
    ngo_id: uuid.UUID,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    doc = OrganizationDocument(
        organization_id=ngo_id,
        document_type=payload.get("document_type", "registration_certificate"),
        file_url=payload.get("file_url", f"https://storage.charityai.org/docs/{ngo_id}_doc.pdf"),
        file_name=payload.get("file_name", "registration_doc.pdf"),
        verification_status=VerificationStatus.PENDING,
    )
    db.add(doc)
    await db.commit()
    return {"document_id": str(doc.id), "status": doc.verification_status}


# ── 7. POST /ngos/{ngo_id}/campaigns ────────────────────────────────────────
@router.post("/{ngo_id}/campaigns", status_code=status.HTTP_201_CREATED, summary="Create campaign under NGO")
async def create_campaign(
    ngo_id: uuid.UUID,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    slug = f"campaign-{uuid.uuid4().hex[:6]}"

    campaign = Campaign(
        organization_id=ngo_id,
        title=payload.get("title", "Community Relief Campaign"),
        slug=slug,
        description=payload.get("description", "Help us serve families in need."),
        campaign_type=payload.get("campaign_type", CampaignType.CLOTHES_DRIVE),
        status=CampaignStatus.ACTIVE,
        goal_amount=payload.get("goal_amount", 50000.0),
        raised_amount=0.0,
        currency="INR",
        created_by=str(current_user.id),
    )
    db.add(campaign)
    await db.commit()
    return {"campaign_id": str(campaign.id), "slug": campaign.slug, "status": campaign.status}


# ── 8. GET /ngos/{ngo_id}/campaigns ─────────────────────────────────────────
@router.get("/{ngo_id}/campaigns", summary="Get NGO campaigns")
async def get_ngo_campaigns(
    ngo_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(Campaign)
        .where(Campaign.organization_id == ngo_id, Campaign.is_deleted == False)
        .order_by(Campaign.created_at.desc())
    )
    campaigns = result.scalars().all()
    return {"items": [_serialize_campaign(c) for c in campaigns]}


# ── 9. GET /ngos/{ngo_id}/analytics ──────────────────────────────────────────
@router.get("/{ngo_id}/analytics", summary="NGO analytics overview")
async def ngo_analytics(
    ngo_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    from app.infrastructure.database.models.donations import Donation

    total_donations = await db.execute(
        select(func.count(Donation.id)).where(
            Donation.ngo_id == ngo_id, Donation.is_deleted == False
        )
    )
    total_amount = await db.execute(
        select(func.sum(Donation.amount)).where(
            Donation.ngo_id == ngo_id, Donation.is_deleted == False
        )
    )
    return {
        "total_donations": total_donations.scalar_one(),
        "total_amount": float(total_amount.scalar_one() or 0),
    }


def _serialize_ngo(ngo: Organization, detailed: bool = False) -> dict:
    data: dict = {
        "id": str(ngo.id),
        "name": ngo.name,
        "slug": ngo.slug,
        "tagline": ngo.tagline,
        "description": ngo.description,
        "city": ngo.city,
        "country": ngo.country,
        "logo_url": ngo.logo_url,
        "rating": ngo.rating,
        "verification_status": ngo.verification_status,
        "total_received": ngo.total_received,
        "impact_score": ngo.impact_score,
        "followers_count": ngo.followers_count,
    }
    if detailed:
        data.update({
            "mission": ngo.mission,
            "vision": ngo.vision,
            "email": ngo.email,
            "phone": ngo.phone,
            "website": ngo.website,
            "categories": ngo.categories,
            "registration_number": ngo.registration_number,
        })
    return data


def _serialize_campaign(c: Campaign) -> dict:
    return {
        "id": str(c.id),
        "title": c.title,
        "campaign_type": c.campaign_type,
        "status": c.status,
        "goal_amount": c.goal_amount,
        "raised_amount": c.raised_amount,
        "donors_count": c.donors_count,
        "ends_at": c.ends_at.isoformat() if c.ends_at else None,
    }
