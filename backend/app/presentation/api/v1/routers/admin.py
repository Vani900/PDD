"""CharityAI – Admin Router"""
from __future__ import annotations
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.infrastructure.database.models.core import FeatureFlag, FraudAlert, SystemSetting
from app.infrastructure.database.models.donations import Donation
from app.infrastructure.database.models.organizations import Organization
from app.infrastructure.database.models.users import AuditLog, User, UserRole
from app.infrastructure.database.session import get_db
from app.presentation.dependencies.auth import get_current_user, require_admin, require_super_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard", summary="Admin dashboard summary")
async def admin_dashboard(current_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)) -> dict:
    users = await db.execute(select(func.count(User.id)).where(User.is_deleted == False))
    donations = await db.execute(select(func.count(Donation.id)).where(Donation.is_deleted == False))
    ngos = await db.execute(select(func.count(Organization.id)).where(Organization.is_deleted == False))
    fraud = await db.execute(select(func.count(FraudAlert.id)).where(FraudAlert.is_resolved == False))
    return {"total_users": users.scalar_one(), "total_donations": donations.scalar_one(), "total_ngos": ngos.scalar_one(), "unresolved_fraud_alerts": fraud.scalar_one()}


@router.get("/users", summary="List all users (Admin)")
async def list_all_users(role: Optional[str] = None, status: Optional[str] = None, search: Optional[str] = None, page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=200), current_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)) -> dict:
    query = select(User).options(selectinload(User.profile)).where(User.is_deleted == False)
    if role:
        query = query.where(User.role == role)
    if status:
        query = query.where(User.account_status == status)
    if search:
        from sqlalchemy import or_
        query = query.where(or_(User.email.ilike(f"%{search}%"), User.phone.ilike(f"%{search}%")))
    total = await db.execute(select(func.count()).select_from(query.subquery()))
    query = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    users = result.scalars().all()
    return {"total": total.scalar_one(), "items": [{"id": str(u.id), "email": u.email, "role": u.role, "status": u.account_status, "created_at": u.created_at.isoformat()} for u in users]}


@router.get("/ngos/pending", summary="List NGOs pending verification")
async def pending_ngos(current_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)) -> dict:
    from app.infrastructure.database.models.users import VerificationStatus
    result = await db.execute(select(Organization).where(Organization.verification_status == VerificationStatus.PENDING, Organization.is_deleted == False).order_by(Organization.created_at))
    ngos = result.scalars().all()
    return {"items": [{"id": str(n.id), "name": n.name, "email": n.email, "city": n.city, "created_at": n.created_at.isoformat()} for n in ngos]}


@router.get("/fraud-alerts", summary="List fraud alerts")
async def list_fraud_alerts(resolved: bool = False, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), current_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)) -> dict:
    query = select(FraudAlert).where(FraudAlert.is_resolved == resolved)
    total = await db.execute(select(func.count()).select_from(query.subquery()))
    result = await db.execute(query.order_by(FraudAlert.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
    alerts = result.scalars().all()
    return {"total": total.scalar_one(), "items": [{"id": str(a.id), "entity_type": a.entity_type, "entity_id": a.entity_id, "alert_type": a.alert_type, "severity": a.severity, "fraud_score": a.fraud_score, "flags": a.flags} for a in alerts]}


@router.patch("/fraud-alerts/{alert_id}/resolve", summary="Resolve a fraud alert")
async def resolve_fraud_alert(alert_id: uuid.UUID, payload: dict, current_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)) -> dict:
    from datetime import UTC, datetime
    result = await db.execute(select(FraudAlert).where(FraudAlert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Alert not found.")
    alert.is_resolved = True
    alert.resolved_at = datetime.now(UTC)
    alert.resolved_by = str(current_user.id)
    alert.resolution_notes = payload.get("notes")
    return {"alert_id": str(alert_id), "resolved": True}


@router.get("/audit-logs", summary="View audit logs")
async def audit_logs(entity_type: Optional[str] = None, action: Optional[str] = None, page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=200), current_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)) -> dict:
    query = select(AuditLog)
    if entity_type:
        query = query.where(AuditLog.entity_type == entity_type)
    if action:
        query = query.where(AuditLog.action == action)
    total = await db.execute(select(func.count()).select_from(query.subquery()))
    result = await db.execute(query.order_by(AuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
    logs = result.scalars().all()
    return {"total": total.scalar_one(), "items": [{"id": str(l.id), "action": l.action, "entity_type": l.entity_type, "entity_id": l.entity_id, "user_id": str(l.user_id) if l.user_id else None, "created_at": l.created_at.isoformat()} for l in logs]}


@router.get("/feature-flags", summary="List feature flags")
async def list_feature_flags(current_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)) -> dict:
    result = await db.execute(select(FeatureFlag).order_by(FeatureFlag.key))
    flags = result.scalars().all()
    return {"items": [{"id": str(f.id), "key": f.key, "value": f.value, "description": f.description, "rollout_percentage": f.rollout_percentage} for f in flags]}


@router.patch("/feature-flags/{key}", summary="Toggle feature flag")
async def toggle_feature_flag(key: str, payload: dict, current_user: User = Depends(require_super_admin), db: AsyncSession = Depends(get_db)) -> dict:
    result = await db.execute(select(FeatureFlag).where(FeatureFlag.key == key))
    flag = result.scalar_one_or_none()
    if not flag:
        flag = FeatureFlag(key=key, value=payload.get("value", False), description=payload.get("description"), updated_by=str(current_user.id))
        db.add(flag)
    else:
        flag.value = payload.get("value", flag.value)
        flag.updated_by = str(current_user.id)
    return {"key": key, "value": flag.value}


@router.get("/system-settings", summary="Get system settings")
async def get_system_settings(current_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)) -> dict:
    result = await db.execute(select(SystemSetting).order_by(SystemSetting.category, SystemSetting.key))
    settings = result.scalars().all()
    return {"items": [{"key": s.key, "value": s.value, "value_type": s.value_type, "category": s.category, "is_public": s.is_public} for s in settings]}
