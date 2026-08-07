"""
CharityAI – Users Router (Production User Management)
Fully backed by PostgreSQL with audit logging, soft delete, and profile completion.
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Annotated, Optional

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    UploadFile,
    status,
)
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import (
    InvalidCredentialsException,
    UserNotFoundException,
    ValidationException,
)
from app.core.security import hash_password, verify_password
from app.infrastructure.database.models.users import (
    AccountStatus,
    AuditLog,
    OTPVerification,
    User,
    UserProfile,
    UserRole,
)
from app.infrastructure.database.session import get_db
from app.presentation.api.v1.schemas.users import (
    EmailChangeRequest,
    PasswordChangeRequest,
    PreferencesUpdate,
    UserActivityResponse,
    UserProfileResponse,
    UserProfileUpdate,
)
from app.presentation.dependencies.auth import get_current_user, require_admin

router = APIRouter(prefix="/users", tags=["User Management"])


def _calculate_completion_percentage(user: User, profile: UserProfile | None) -> int:
    """Calculate profile completion percentage based on filled fields."""
    if not profile:
        return 20
    fields = [
        profile.first_name,
        profile.last_name,
        user.email,
        user.phone,
        profile.display_name,
        profile.bio,
        profile.avatar_url,
        profile.city,
        profile.state,
        profile.country,
    ]
    filled = sum(1 for f in fields if f and str(f).strip())
    return int((filled / len(fields)) * 100)


async def _log_user_action(
    db: AsyncSession,
    user_id: uuid.UUID,
    action: str,
    entity_type: str,
    entity_id: str | None = None,
    old_values: dict | None = None,
    new_values: dict | None = None,
    request: Request | None = None,
) -> None:
    """Helper to record audit trail in PostgreSQL audit_logs table."""
    audit = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id or str(user_id),
        old_values=old_values,
        new_values=new_values,
        ip_address=request.client.host if request and request.client else None,
        user_agent=request.headers.get("user-agent") if request else None,
    )
    db.add(audit)


# ── 1. GET /users/me ─────────────────────────────────────────────────────────
@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Get current user profile with completion percentage",
)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserProfileResponse:
    result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id == current_user.id)
    )
    user = result.scalar_one()
    profile = user.profile

    completion = _calculate_completion_percentage(user, profile)

    return UserProfileResponse(
        user_id=str(user.id),
        email=user.email,
        phone=user.phone,
        role=user.role,
        account_status=user.account_status,
        email_verified=user.email_verified,
        phone_verified=user.phone_verified,
        first_name=profile.first_name if profile else "",
        last_name=profile.last_name if profile else "",
        display_name=profile.display_name if profile else None,
        bio=profile.bio if profile else None,
        avatar_url=profile.avatar_url if profile else None,
        gender=profile.gender if profile else None,
        address_line1=profile.address_line1 if profile else None,
        address_line2=profile.address_line2 if profile else None,
        city=profile.city if profile else None,
        state=profile.state if profile else None,
        country=profile.country if profile else None,
        postal_code=profile.postal_code if profile else None,
        impact_score=profile.impact_score if profile else 0,
        total_donations_count=profile.total_donations_count if profile else 0,
        total_donation_amount=profile.total_donation_amount if profile else 0.0,
        volunteer_hours=profile.volunteer_hours if profile else 0.0,
        level=profile.level if profile else 1,
        language=profile.language if profile else "en",
        timezone=profile.timezone if profile else "UTC",
        theme=profile.theme if profile else "light",
        notification_preferences=profile.notification_preferences if profile else {},
        completion_percentage=completion,
        created_at=user.created_at,
    )


# ── 1b. GET /users/me/impact ─────────────────────────────────────────────────
@router.get(
    "/me/impact",
    summary="Get current user's donation impact statistics",
)
async def get_my_impact(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    from app.infrastructure.database.models.donations import Donation, DonationStatus

    # Total donations count
    total_q = await db.execute(
        select(func.count(Donation.id)).where(
            Donation.donor_id == current_user.id, Donation.is_deleted == False
        )
    )
    total_donations = total_q.scalar_one() or 0

    # Total amount donated (monetary donations)
    amount_q = await db.execute(
        select(func.sum(Donation.amount)).where(
            Donation.donor_id == current_user.id, Donation.is_deleted == False
        )
    )
    total_amount = float(amount_q.scalar_one() or 0.0)

    # Completed donations
    completed_q = await db.execute(
        select(func.count(Donation.id)).where(
            Donation.donor_id == current_user.id,
            Donation.is_deleted == False,
            Donation.status == DonationStatus.DISTRIBUTED,
        )
    )
    completed = completed_q.scalar_one() or 0

    # Active donations (pending/in-transit)
    active_q = await db.execute(
        select(func.count(Donation.id)).where(
            Donation.donor_id == current_user.id,
            Donation.is_deleted == False,
            Donation.status.in_([DonationStatus.PENDING, DonationStatus.PICKUP_ARRANGED, DonationStatus.IN_TRANSIT]),
        )
    )
    active = active_q.scalar_one() or 0

    # Get profile for impact score / level
    result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id == current_user.id)
    )
    user = result.scalar_one()
    profile = user.profile

    impact_score = getattr(profile, "impact_score", 0) or 0
    level = getattr(profile, "level", 1) or 1
    volunteer_hours = getattr(profile, "volunteer_hours", 0.0) or 0.0

    return {
        "total_donations": total_donations,
        "total_amount": total_amount,
        "completed_donations": completed,
        "active_donations": active,
        "impact_score": impact_score,
        "level": level,
        "volunteer_hours": volunteer_hours,
        "rank": "Compassionate Giver" if total_donations >= 5 else "First Step" if total_donations > 0 else "New Member",
    }




# ── 2. PUT /users/me ─────────────────────────────────────────────────────────
@router.put(
    "/me",
    summary="Update profile details and address in PostgreSQL",
)
async def update_me(
    payload: UserProfileUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id == current_user.id)
    )
    user = result.scalar_one()

    if not user.profile:
        user.profile = UserProfile(
            user_id=user.id,
            first_name=payload.first_name or "User",
            last_name=payload.last_name or "",
        )

    profile = user.profile
    old_data = {
        "first_name": profile.first_name,
        "last_name": profile.last_name,
        "city": profile.city,
    }

    update_dict = payload.model_dump(exclude_unset=True)
    if "phone" in update_dict:
        user.phone = update_dict.pop("phone")

    for field, val in update_dict.items():
        setattr(profile, field, val)

    await _log_user_action(
        db, user.id, "PROFILE_UPDATE", "UserProfile", str(profile.id), old_data, update_dict, request
    )

    await db.commit()
    return {"message": "Profile updated successfully.", "user_id": str(user.id)}


# ── 3. PUT /users/password ──────────────────────────────────────────────────
@router.put(
    "/password",
    summary="Change user password with bcrypt hashing",
)
async def change_password(
    payload: PasswordChangeRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if not current_user.hashed_password or not verify_password(
        payload.current_password, current_user.hashed_password
    ):
        raise InvalidCredentialsException("Current password is incorrect.")

    current_user.hashed_password = hash_password(payload.new_password)
    current_user.password_changed_at = datetime.now(UTC)

    await _log_user_action(
        db, current_user.id, "PASSWORD_CHANGE", "User", str(current_user.id), request=request
    )

    await db.commit()
    return {"message": "Password changed successfully."}


# ── 4. PUT /users/email ─────────────────────────────────────────────────────
@router.put(
    "/email",
    summary="Change user email address",
)
async def change_email(
    payload: EmailChangeRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if not current_user.hashed_password or not verify_password(
        payload.current_password, current_user.hashed_password
    ):
        raise InvalidCredentialsException("Password confirmation failed.")

    # Check duplicate email
    existing = await db.execute(
        select(User).where(User.email == payload.new_email.lower(), User.id != current_user.id)
    )
    if existing.scalar_one_or_none():
        raise ValidationException("Email address is already in use by another account.")

    old_email = current_user.email
    current_user.email = payload.new_email.lower()
    current_user.email_verified = False

    await _log_user_action(
        db,
        current_user.id,
        "EMAIL_CHANGE",
        "User",
        str(current_user.id),
        {"old_email": old_email},
        {"new_email": current_user.email},
        request,
    )

    await db.commit()
    return {"message": "Email updated successfully. Please verify your new email."}


# ── 5. POST /users/avatar ───────────────────────────────────────────────────
@router.post(
    "/avatar",
    summary="Upload user avatar image",
)
async def upload_avatar(
    payload: Optional[dict] = None,
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id == current_user.id)
    )
    user = result.scalar_one()

    if not user.profile:
        user.profile = UserProfile(user_id=user.id, first_name="User", last_name="")

    avatar_url = None
    if file:
        avatar_url = f"https://storage.charityai.org/avatars/{user.id}_{file.filename}"
    elif payload and "avatar_url" in payload:
        avatar_url = payload["avatar_url"]
    else:
        avatar_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={user.email}"

    user.profile.avatar_url = avatar_url
    await db.commit()

    return {"message": "Avatar updated successfully.", "avatar_url": avatar_url}


# ── 6. DELETE /users/me ─────────────────────────────────────────────────────
@router.delete(
    "/me",
    summary="Soft delete user account in PostgreSQL",
)
async def delete_account(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    current_user.is_deleted = True
    current_user.deleted_at = datetime.now(UTC)
    current_user.deleted_by = str(current_user.id)
    current_user.account_status = AccountStatus.SUSPENDED

    await _log_user_action(
        db, current_user.id, "ACCOUNT_DELETE", "User", str(current_user.id), request=request
    )

    await db.commit()
    return {"message": "Account soft deleted successfully."}


# ── 7. POST /users/restore ──────────────────────────────────────────────────
@router.post(
    "/restore",
    summary="Restore soft-deleted user account",
)
async def restore_account(
    user_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise UserNotFoundException()

    user.is_deleted = False
    user.deleted_at = None
    user.deleted_by = None
    user.account_status = AccountStatus.ACTIVE

    await _log_user_action(
        db, current_user.id, "ACCOUNT_RESTORE", "User", str(user.id), request=request
    )

    await db.commit()
    return {"message": "User account restored successfully.", "user_id": str(user.id)}


# ── 8. GET /users/activity ──────────────────────────────────────────────────
@router.get(
    "/activity",
    summary="Get user activity history from PostgreSQL audit logs",
)
async def get_activity(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    query = (
        select(AuditLog)
        .where(AuditLog.user_id == current_user.id)
        .order_by(AuditLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    logs = result.scalars().all()

    total_query = select(func.count(AuditLog.id)).where(AuditLog.user_id == current_user.id)
    total_res = await db.execute(total_query)

    return {
        "total": total_res.scalar_one(),
        "page": page,
        "page_size": page_size,
        "items": [
            {
                "id": str(log.id),
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "ip_address": log.ip_address,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ],
    }


# ── 9 & 10. GET/PUT /users/preferences ──────────────────────────────────────
@router.get(
    "/preferences",
    summary="Get user notification and privacy preferences",
)
async def get_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id == current_user.id)
    )
    user = result.scalar_one()
    prefs = user.profile.notification_preferences if user.profile else {}
    return {
        "email_notifications": prefs.get("email_notifications", True),
        "push_notifications": prefs.get("push_notifications", True),
        "sms_notifications": prefs.get("sms_notifications", False),
        "marketing_emails": prefs.get("marketing_emails", False),
        "public_profile": prefs.get("public_profile", True),
        "show_donation_history": prefs.get("show_donation_history", True),
    }


@router.put(
    "/preferences",
    summary="Update user notification and privacy preferences",
)
async def update_preferences(
    payload: PreferencesUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id == current_user.id)
    )
    user = result.scalar_one()

    if not user.profile:
        user.profile = UserProfile(user_id=user.id, first_name="User", last_name="")

    new_prefs = payload.model_dump()
    user.profile.notification_preferences = new_prefs

    await _log_user_action(
        db, current_user.id, "PREFERENCES_UPDATE", "UserProfile", str(user.profile.id), new_values=new_prefs, request=request
    )

    await db.commit()
    return {"message": "Preferences updated successfully.", "preferences": new_prefs}
