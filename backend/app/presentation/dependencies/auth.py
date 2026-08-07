"""
CharityAI – Auth Dependencies
FastAPI dependencies for JWT authentication and role-based access control.
"""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    ExpiredTokenException,
    InsufficientPermissionsException,
    InvalidTokenException,
)
from app.core.security import decode_token
from app.infrastructure.database.models.users import AccountStatus, User, UserRole
from app.infrastructure.database.session import get_db

_bearer = HTTPBearer(auto_error=False)


async def _get_user_from_token(
    credentials: HTTPAuthorizationCredentials | None,
    db: AsyncSession,
) -> User | None:
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials, expected_type="access")
        user_id = payload.get("sub")
        if not user_id:
            return None
    except (ExpiredTokenException, InvalidTokenException):
        return None

    result = await db.execute(
        select(User).where(User.id == uuid.UUID(str(user_id)), User.is_deleted == False)
    )
    return result.scalar_one_or_none()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    db: AsyncSession = Depends(get_db),
) -> User:
    """Require a valid JWT. Raises 401 if missing/invalid."""
    user = await _get_user_from_token(credentials, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error_code": "UNAUTHORIZED", "message": "Not authenticated."},
            headers={"WWW-Authenticate": "Bearer"},
        )
    if user.account_status not in (AccountStatus.ACTIVE,):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error_code": "ACCOUNT_INACTIVE", "message": "Account is not active."},
        )
    return user


async def get_optional_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Return current user or None — for public endpoints that optionally authenticate."""
    return await _get_user_from_token(credentials, db)


def require_roles(*roles: UserRole):
    """Dependency factory: require one of the given roles."""

    async def _check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise InsufficientPermissionsException(
                f"Requires one of roles: {', '.join(r.value for r in roles)}"
            )
        return current_user

    return _check


# ── Pre-built role dependencies ───────────────────────────────────────────────
require_super_admin = require_roles(UserRole.SUPER_ADMIN)
require_admin = require_roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
require_ngo_admin = require_roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.NGO_ADMIN)
require_staff = require_roles(
    UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.NGO_ADMIN, UserRole.NGO_STAFF
)
require_donor = require_roles(UserRole.DONOR, UserRole.SUPER_ADMIN, UserRole.ADMIN)
require_volunteer = require_roles(UserRole.VOLUNTEER, UserRole.SUPER_ADMIN, UserRole.ADMIN)
require_receiver = require_roles(UserRole.RECEIVER, UserRole.SUPER_ADMIN, UserRole.ADMIN)
require_corporate = require_roles(UserRole.CORPORATE_CSR, UserRole.SUPER_ADMIN, UserRole.ADMIN)
require_moderator = require_roles(UserRole.MODERATOR, UserRole.SUPER_ADMIN, UserRole.ADMIN)
