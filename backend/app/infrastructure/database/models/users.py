"""
CharityAI – User & Authentication Models
"""
from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.models.base import BaseModel, TimestampMixin, UUIDMixin
from app.infrastructure.database.session import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models.donations import Donation
    from app.infrastructure.database.models.organizations import Organization


# ── Enums ─────────────────────────────────────────────────────────────────────
class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    NGO_ADMIN = "ngo_admin"
    NGO_STAFF = "ngo_staff"
    DONOR = "donor"
    VOLUNTEER = "volunteer"
    RECEIVER = "receiver"
    CORPORATE_CSR = "corporate_csr"
    GUEST = "guest"
    AUDITOR = "auditor"
    MODERATOR = "moderator"
    SUPPORT = "support"


class AuthProvider(str, Enum):
    EMAIL = "email"
    GOOGLE = "google"
    MICROSOFT = "microsoft"
    APPLE = "apple"
    PHONE = "phone"


class AccountStatus(str, Enum):
    PENDING_VERIFICATION = "pending_verification"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DEACTIVATED = "deactivated"
    BANNED = "banned"


class VerificationStatus(str, Enum):
    UNVERIFIED = "unverified"
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


# ── User Model ────────────────────────────────────────────────────────────────
class User(Base, BaseModel):
    """
    Core user entity. All roles use this table with RBAC.
    Supports multiple auth providers via oauth_providers JSON.
    """

    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("email", name="uq_users_email"),
        UniqueConstraint("phone", name="uq_users_phone"),
        Index("ix_users_role", "role"),
        Index("ix_users_status", "account_status"),
        Index("ix_users_created_at", "created_at"),
        {"schema": None},
    )

    # ── Core Identity ────────────────────────────────────────────────────────
    email: Mapped[str] = mapped_column(String(254), nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    hashed_password: Mapped[str | None] = mapped_column(String(72), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        String(30), nullable=False, default=UserRole.DONOR
    )

    # ── Auth Provider ─────────────────────────────────────────────────────────
    auth_provider: Mapped[AuthProvider] = mapped_column(
        String(20), nullable=False, default=AuthProvider.EMAIL
    )
    oauth_providers: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    # {"google": {"id": "...", "token": "..."}, "microsoft": {...}}

    # ── Account Status ────────────────────────────────────────────────────────
    account_status: Mapped[AccountStatus] = mapped_column(
        String(30), nullable=False, default=AccountStatus.PENDING_VERIFICATION
    )
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    phone_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    identity_verified: Mapped[VerificationStatus] = mapped_column(
        String(20), nullable=False, default=VerificationStatus.UNVERIFIED
    )

    # ── Security ──────────────────────────────────────────────────────────────
    is_2fa_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    totp_secret: Mapped[str | None] = mapped_column(String(64), nullable=True)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_login_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    password_changed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Metadata ──────────────────────────────────────────────────────────────
    referral_code: Mapped[str | None] = mapped_column(String(20), nullable=True, unique=True)
    referred_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    extra_metadata: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)
    # Extra data: {"source": "landing_page", "campaign": "july_2025", ...}

    # ── Relationships ─────────────────────────────────────────────────────────
    profile: Mapped["UserProfile"] = relationship(
        "UserProfile", back_populates="user", uselist=False, lazy="selectin"
    )
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
    otp_verifications: Mapped[list["OTPVerification"]] = relationship(
        "OTPVerification", back_populates="user", cascade="all, delete-orphan"
    )
    sessions: Mapped[list["UserSession"]] = relationship(
        "UserSession", back_populates="user", cascade="all, delete-orphan"
    )
    documents: Mapped[list["UserDocument"]] = relationship(
        "UserDocument", back_populates="user", cascade="all, delete-orphan"
    )
    audit_logs: Mapped[list["AuditLog"]] = relationship(
        "AuditLog", back_populates="user", lazy="dynamic"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"

    @property
    def full_name(self) -> str:
        if self.profile:
            return self.profile.full_name
        return self.email


# ── User Profile ──────────────────────────────────────────────────────────────
class UserProfile(Base, UUIDMixin, TimestampMixin):
    """Extended user profile information."""

    __tablename__ = "user_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    date_of_birth: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    gender: Mapped[Gender | None] = mapped_column(String(20), nullable=True)

    # ── Address ───────────────────────────────────────────────────────────────
    address_line1: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address_line2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    latitude: Mapped[float | None] = mapped_column(nullable=True)
    longitude: Mapped[float | None] = mapped_column(nullable=True)

    # ── Gamification ──────────────────────────────────────────────────────────
    impact_score: Mapped[int] = mapped_column(Integer, default=0)
    total_donations_count: Mapped[int] = mapped_column(Integer, default=0)
    total_donation_amount: Mapped[float] = mapped_column(default=0.0)
    volunteer_hours: Mapped[float] = mapped_column(default=0.0)
    badges: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    level: Mapped[int] = mapped_column(Integer, default=1)

    # ── Preferences ───────────────────────────────────────────────────────────
    language: Mapped[str] = mapped_column(String(10), default="en")
    timezone: Mapped[str] = mapped_column(String(50), default="UTC")
    notification_preferences: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    theme: Mapped[str] = mapped_column(String(10), default="light")

    # ── Relationships ─────────────────────────────────────────────────────────
    user: Mapped["User"] = relationship("User", back_populates="profile")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()


# ── Refresh Token ─────────────────────────────────────────────────────────────
class RefreshToken(Base, UUIDMixin, TimestampMixin):
    """Stored refresh tokens for rotation tracking and revocation."""

    __tablename__ = "refresh_tokens"
    __table_args__ = (
        Index("ix_refresh_tokens_user_id", "user_id"),
        Index("ix_refresh_tokens_jti", "jti"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    jti: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    token_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    device_id: Mapped[str | None] = mapped_column(String(100), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens")


# ── OTP Verification ──────────────────────────────────────────────────────────
class OTPVerification(Base, UUIDMixin, TimestampMixin):
    """Email and SMS OTP verification records."""

    __tablename__ = "otp_verifications"
    __table_args__ = (Index("ix_otp_user_id_type", "user_id", "otp_type"),)

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    otp_type: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # "email_verification", "phone_verification", "password_reset", "login"
    otp_code: Mapped[str] = mapped_column(String(10), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, default=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    max_attempts: Mapped[int] = mapped_column(Integer, default=5)

    user: Mapped["User"] = relationship("User", back_populates="otp_verifications")


# ── User Session ──────────────────────────────────────────────────────────────
class UserSession(Base, UUIDMixin, TimestampMixin):
    """Active user sessions for multi-device tracking."""

    __tablename__ = "user_sessions"
    __table_args__ = (Index("ix_sessions_user_id", "user_id"),)

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    session_token: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    device_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    device_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    device_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    os: Mapped[str | None] = mapped_column(String(50), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    fcm_token: Mapped[str | None] = mapped_column(String(500), nullable=True)
    last_active_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    user: Mapped["User"] = relationship("User", back_populates="sessions")


# ── User Document ─────────────────────────────────────────────────────────────
class UserDocument(Base, BaseModel):
    """KYC and identity verification documents."""

    __tablename__ = "user_documents"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    document_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # "aadhaar", "pan", "passport", "driving_license", "voter_id"
    document_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    verification_status: Mapped[VerificationStatus] = mapped_column(
        String(20), nullable=False, default=VerificationStatus.PENDING
    )
    verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    verified_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    ocr_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    user: Mapped["User"] = relationship("User", back_populates="documents")


# ── Audit Log ─────────────────────────────────────────────────────────────────
class AuditLog(Base, UUIDMixin, TimestampMixin):
    """
    Immutable audit trail — never soft-deleted, never updated.
    Records every meaningful state change in the system.
    """

    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_user_id", "user_id"),
        Index("ix_audit_entity", "entity_type", "entity_id"),
        Index("ix_audit_created_at", "created_at"),
        Index("ix_audit_action", "action"),
    )

    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    old_values: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    new_values: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    request_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    additional_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    user: Mapped["User | None"] = relationship("User", back_populates="audit_logs")
