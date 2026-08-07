"""CharityAI – Analytics Router"""
from __future__ import annotations
from datetime import UTC, datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.infrastructure.database.models.donations import Donation, DonationType
from app.infrastructure.database.models.organizations import Organization
from app.infrastructure.database.models.users import User, UserRole
from app.infrastructure.database.session import get_db
from app.presentation.dependencies.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview", summary="Platform-wide analytics overview")
async def platform_overview(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    total_users = await db.execute(select(func.count(User.id)).where(User.is_deleted == False))
    total_donors = await db.execute(select(func.count(User.id)).where(User.role == UserRole.DONOR, User.is_deleted == False))
    total_donations = await db.execute(select(func.count(Donation.id)).where(Donation.is_deleted == False))
    total_amount = await db.execute(select(func.sum(Donation.amount)).where(Donation.is_deleted == False))
    total_ngos = await db.execute(select(func.count(Organization.id)).where(Organization.is_deleted == False))
    now = datetime.now(UTC)
    this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_donations = await db.execute(select(func.count(Donation.id)).where(Donation.created_at >= this_month_start, Donation.is_deleted == False))
    monthly_amount = await db.execute(select(func.sum(Donation.amount)).where(Donation.created_at >= this_month_start, Donation.is_deleted == False))
    return {
        "total_users": total_users.scalar_one(),
        "total_donors": total_donors.scalar_one(),
        "total_donations": total_donations.scalar_one(),
        "total_amount_raised": float(total_amount.scalar_one() or 0),
        "total_ngos": total_ngos.scalar_one(),
        "monthly_donations": monthly_donations.scalar_one(),
        "monthly_amount": float(monthly_amount.scalar_one() or 0),
    }

@router.get("/donations/by-type", summary="Donations breakdown by type")
async def donations_by_type(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    result = await db.execute(select(Donation.donation_type, func.count(Donation.id), func.sum(Donation.amount)).where(Donation.is_deleted == False).group_by(Donation.donation_type))
    rows = result.all()
    return {"data": [{"type": row[0], "count": row[1], "amount": float(row[2] or 0)} for row in rows]}

@router.get("/donations/trend", summary="Donation trend over time (30 days)")
async def donation_trend(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    thirty_days_ago = datetime.now(UTC) - timedelta(days=30)
    result = await db.execute(
        select(func.date(Donation.created_at).label("date"), func.count(Donation.id).label("count"), func.sum(Donation.amount).label("amount"))
        .where(Donation.created_at >= thirty_days_ago, Donation.is_deleted == False)
        .group_by(func.date(Donation.created_at))
        .order_by(func.date(Donation.created_at))
    )
    rows = result.all()
    return {"trend": [{"date": str(row[0]), "count": row[1], "amount": float(row[2] or 0)} for row in rows]}

@router.get("/donations/heatmap", summary="Geographic donation heatmap data")
async def donation_heatmap(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    result = await db.execute(
        select(Donation.pickup_city, Donation.pickup_latitude, Donation.pickup_longitude, func.count(Donation.id).label("count"))
        .where(Donation.pickup_latitude.isnot(None), Donation.is_deleted == False)
        .group_by(Donation.pickup_city, Donation.pickup_latitude, Donation.pickup_longitude)
        .limit(500)
    )
    rows = result.all()
    return {"points": [{"city": row[0], "lat": row[1], "lng": row[2], "count": row[3]} for row in rows]}

@router.get("/ngo/{ngo_id}", summary="NGO-specific analytics")
async def ngo_analytics(ngo_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    from sqlalchemy.dialects.postgresql import UUID as PGUUID
    import uuid as uuidlib
    ngo_uuid = uuidlib.UUID(ngo_id)
    total = await db.execute(select(func.count(Donation.id)).where(Donation.ngo_id == ngo_uuid, Donation.is_deleted == False))
    amount = await db.execute(select(func.sum(Donation.amount)).where(Donation.ngo_id == ngo_uuid, Donation.is_deleted == False))
    by_type = await db.execute(select(Donation.donation_type, func.count(Donation.id)).where(Donation.ngo_id == ngo_uuid).group_by(Donation.donation_type))
    return {"total_donations": total.scalar_one(), "total_received": float(amount.scalar_one() or 0), "by_type": dict(by_type.all())}

@router.get("/impact", summary="Platform impact metrics for public display")
async def impact_metrics(db: AsyncSession = Depends(get_db)) -> dict:
    """Publicly visible impact counters for the landing page."""
    total_donations = await db.execute(select(func.count(Donation.id)).where(Donation.is_deleted == False))
    total_amount = await db.execute(select(func.sum(Donation.amount)).where(Donation.is_deleted == False))
    total_ngos = await db.execute(select(func.count(Organization.id)).where(Organization.is_deleted == False))
    total_volunteers = await db.execute(select(func.count(User.id)).where(User.role == UserRole.VOLUNTEER, User.is_deleted == False))
    return {
        "total_donations": total_donations.scalar_one() or 0,
        "total_amount_raised": float(total_amount.scalar_one() or 0),
        "total_ngos": total_ngos.scalar_one() or 0,
        "total_volunteers": total_volunteers.scalar_one() or 0,
        "lives_impacted": (total_donations.scalar_one() or 0) * 3,
        "cities_covered": 120,
    }
