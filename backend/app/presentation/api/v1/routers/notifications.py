"""CharityAI – Notifications Router"""
from __future__ import annotations
import uuid
from datetime import UTC, datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.infrastructure.database.models.core import Notification
from app.infrastructure.database.models.users import User
from app.infrastructure.database.session import get_db
from app.presentation.dependencies.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", summary="Get my notifications")
async def get_notifications(unread_only: bool = False, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    query = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        query = query.where(Notification.is_read == False)
    total = await db.execute(select(func.count()).select_from(query.subquery()))
    unread = await db.execute(select(func.count(Notification.id)).where(Notification.user_id == current_user.id, Notification.is_read == False))
    result = await db.execute(query.order_by(Notification.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
    notifications = result.scalars().all()
    return {"total": total.scalar_one(), "unread_count": unread.scalar_one(), "items": [{"id": str(n.id), "title": n.title, "body": n.body, "notification_type": n.notification_type, "is_read": n.is_read, "entity_type": n.entity_type, "entity_id": n.entity_id, "action_url": n.action_url, "created_at": n.created_at.isoformat()} for n in notifications]}

@router.patch("/{notification_id}/read", summary="Mark notification as read")
async def mark_read(notification_id: uuid.UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    result = await db.execute(select(Notification).where(Notification.id == notification_id, Notification.user_id == current_user.id))
    notif = result.scalar_one_or_none()
    if notif:
        notif.is_read = True
        notif.read_at = datetime.now(UTC)
    return {"notification_id": str(notification_id), "read": True}

@router.post("/mark-all-read", summary="Mark all notifications as read")
async def mark_all_read(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    result = await db.execute(select(Notification).where(Notification.user_id == current_user.id, Notification.is_read == False))
    notifications = result.scalars().all()
    now = datetime.now(UTC)
    for n in notifications:
        n.is_read = True
        n.read_at = now
    return {"marked_count": len(notifications)}

@router.post("/test-push", summary="Send test push notification (Dev)")
async def test_push(payload: dict, current_user: User = Depends(get_current_user)) -> dict:
    try:
        from app.infrastructure.notifications.fcm_service import send_push_notification
        result = await send_push_notification(token=payload.get("fcm_token", ""), title=payload.get("title", "Test"), body=payload.get("body", "Test notification from CharityAI"))
        return {"sent": True}
    except Exception as e:
        return {"sent": False, "error": str(e)}
