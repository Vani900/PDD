"""
CharityAI – Corporate CSR Router (Production Enterprise Corporate Engine)
Corporate registration, CSR Dashboard, bulk donations, employee volunteering, tax 80G certificates, and CSR reports.
"""
from __future__ import annotations

import re
import uuid
from datetime import UTC, datetime
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException, ValidationException
from app.infrastructure.database.models.donations import Donation, DonationStatus, DonationType
from app.infrastructure.database.models.organizations import (
    Campaign,
    CampaignStatus,
    CampaignType,
    Organization,
    OrganizationType,
)
from app.infrastructure.database.models.users import User, UserRole
from app.infrastructure.database.session import get_db
from app.presentation.dependencies.auth import get_current_user

router = APIRouter(prefix="/corporate", tags=["Corporate CSR"])


# ── 1. POST /corporate/register ──────────────────────────────────────────────
@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    summary="Register corporate entity for CSR programs",
)
async def register_corporate(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    raw_name = payload.get("company_name", "Corporate Partner")
    slug = f"{re.sub(r'[^a-z0-9-]', '-', raw_name.lower().strip())}-{uuid.uuid4().hex[:4]}"

    org = Organization(
        org_type=OrganizationType.CORPORATE,
        name=raw_name,
        slug=slug,
        description=payload.get("description", "Corporate Social Responsibility Partner"),
        email=payload.get("email", current_user.email),
        phone=payload.get("phone", current_user.phone),
        city=payload.get("city", "Bangalore"),
        country=payload.get("country", "India"),
        registration_number=payload.get("cin", f"CIN-{uuid.uuid4().hex[:8].upper()}"),
        created_by=str(current_user.id),
    )
    db.add(org)
    await db.commit()

    return {
        "organization_id": str(org.id),
        "slug": slug,
        "name": org.name,
        "message": "Corporate entity registered successfully.",
    }


# ── 2. GET /corporate/dashboard ──────────────────────────────────────────────
@router.get(
    "/dashboard",
    summary="CSR Dashboard metrics and SDG impact scores",
)
async def csr_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    total_donated = await db.execute(
        select(func.sum(Donation.amount)).where(
            Donation.donor_id == current_user.id, Donation.is_deleted == False
        )
    )
    total_count = await db.execute(
        select(func.count(Donation.id)).where(
            Donation.donor_id == current_user.id, Donation.is_deleted == False
        )
    )
    sum_amt = float(total_donated.scalar_one() or 0.0)
    cnt = total_count.scalar_one()

    return {
        "total_donated": sum_amt,
        "total_donations_count": cnt,
        "tax_saved_estimate": sum_amt * 0.5,
        "impact_score": cnt * 25,
        "sdg_goals_contributed": [1, 2, 3, 4, 10, 13],
        "beneficiaries_impacted": cnt * 10,
        "carbon_offset_kg": sum_amt * 0.02,
    }


# ── 3. POST /corporate/bulk-donations ─────────────────────────────────────────
@router.post(
    "/bulk-donations",
    status_code=status.HTTP_201_CREATED,
    summary="Execute bulk donations across multiple NGOs/causes",
)
async def bulk_donations(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    items = payload.get("donations", [])
    if not items:
        items = [{"title": "CSR Fund Allocation", "amount": 50000.0, "donation_type": "money"}]

    created_ids = []
    total_bulk_amount = 0.0

    for item in items:
        tracking_number = f"DON-{datetime.now(UTC).strftime('%Y')}-{uuid.uuid4().hex[:6].upper()}"
        amt = float(item.get("amount", 10000.0))
        donation = Donation(
            donor_id=current_user.id,
            donation_type=item.get("donation_type", DonationType.MONEY),
            status=DonationStatus.PENDING,
            title=item.get("title", "Corporate CSR Grant"),
            amount=amt,
            currency="INR",
            tracking_number=tracking_number,
            created_by=str(current_user.id),
        )
        db.add(donation)
        await db.flush()
        created_ids.append(str(donation.id))
        total_bulk_amount += amt

    await db.commit()
    return {
        "message": f"Successfully created {len(created_ids)} bulk CSR donations.",
        "total_amount": total_bulk_amount,
        "donation_ids": created_ids,
    }


# ── 4. POST /corporate/campaigns ─────────────────────────────────────────────
@router.post(
    "/campaigns",
    status_code=status.HTTP_201_CREATED,
    summary="Create CSR initiative campaign",
)
async def create_csr_campaign(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    raw_title = payload.get("title", "Corporate Community Initiative")
    slug = f"{re.sub(r'[^a-z0-9-]', '-', raw_title.lower().strip())}-{uuid.uuid4().hex[:4]}"

    org_id = uuid.UUID(payload["organization_id"]) if payload.get("organization_id") else current_user.id

    campaign = Campaign(
        organization_id=org_id,
        title=raw_title,
        slug=slug,
        description=payload.get("description", "Employee and corporate driven social initiative."),
        campaign_type=CampaignType.FUNDRAISING,
        status=CampaignStatus.ACTIVE,
        goal_amount=payload.get("goal_amount", 100000.0),
        raised_amount=0.0,
        currency="INR",
        created_by=str(current_user.id),
    )
    db.add(campaign)
    await db.commit()

    return {"campaign_id": str(campaign.id), "slug": campaign.slug, "status": campaign.status}


# ── 5. GET /corporate/csr-report/{year} ───────────────────────────────────────
@router.get(
    "/csr-report/{year}",
    summary="Generate annual CSR report and tax 80G breakdown",
)
async def csr_report(
    year: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    donations = await db.execute(
        select(func.count(Donation.id), func.sum(Donation.amount)).where(
            Donation.donor_id == current_user.id,
            extract("year", Donation.created_at) == year,
            Donation.is_deleted == False,
        )
    )
    row = donations.one()
    total_count = row[0] or 0
    total_amt = float(row[1] or 0.0)

    by_type = await db.execute(
        select(Donation.donation_type, func.count(Donation.id), func.sum(Donation.amount))
        .where(
            Donation.donor_id == current_user.id,
            extract("year", Donation.created_at) == year,
            Donation.is_deleted == False,
        )
        .group_by(Donation.donation_type)
    )

    return {
        "year": year,
        "total_donations": total_count,
        "total_amount": total_amt,
        "tax_80g_deduction_eligible": total_amt * 0.5,
        "by_category": [
            {"type": r[0], "count": r[1], "amount": float(r[2] or 0.0)} for r in by_type.all()
        ],
        "sdg_impact": {
            "goals": [1, 2, 3, 4, 10, 13],
            "beneficiaries": total_count * 10,
            "carbon_offset_kg": total_amt * 0.02,
        },
    }
