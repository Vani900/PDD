"""
CharityAI – Volunteer, Receiver, Payment, Notification, and AI Models
"""
from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.models.base import BaseModel, TimestampMixin, UUIDMixin
from app.infrastructure.database.session import Base


# ══════════════════════════════════════════════════════════════════════════════
# VOLUNTEER MODELS
# ══════════════════════════════════════════════════════════════════════════════

class TaskStatus(str, Enum):
    OPEN = "open"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    VERIFIED = "verified"


class Volunteer(Base, BaseModel):
    """Volunteer profile extending the base User."""

    __tablename__ = "volunteers"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )
    ngo_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True
    )
    skills: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    languages: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    availability: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    # {"monday": ["9:00-12:00", "14:00-18:00"], "tuesday": [...]}
    max_tasks_per_week: Mapped[int] = mapped_column(Integer, default=5)
    total_tasks_completed: Mapped[int] = mapped_column(Integer, default=0)
    total_hours: Mapped[float] = mapped_column(Float, default=0.0)
    rating: Mapped[float] = mapped_column(Float, default=0.0)
    rating_count: Mapped[int] = mapped_column(Integer, default=0)
    rank: Mapped[str] = mapped_column(String(50), default="newcomer")
    # "newcomer", "helper", "contributor", "champion", "legend"
    badges: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    vehicle_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    service_radius_km: Mapped[float] = mapped_column(Float, default=10.0)
    current_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    background_check_status: Mapped[str] = mapped_column(String(20), default="pending")

    user: Mapped["User"] = relationship("User")  # type: ignore[name-defined]
    tasks: Mapped[list["VolunteerTask"]] = relationship(
        "VolunteerTask", back_populates="volunteer"
    )
    certificates: Mapped[list["VolunteerCertificate"]] = relationship(
        "VolunteerCertificate", back_populates="volunteer"
    )


class VolunteerTask(Base, BaseModel):
    """Tasks assigned to volunteers (pickup, delivery, event support)."""

    __tablename__ = "volunteer_tasks"
    __table_args__ = (
        Index("ix_vol_task_volunteer_id", "volunteer_id"),
        Index("ix_vol_task_status", "status"),
    )

    volunteer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("volunteers.id", ondelete="CASCADE")
    )
    donation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("donations.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    task_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[TaskStatus] = mapped_column(String(20), default=TaskStatus.OPEN)
    priority: Mapped[str] = mapped_column(String(10), default="medium")
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pickup_location: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    drop_location: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    points_earned: Mapped[int] = mapped_column(Integer, default=0)
    qr_check_in_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    checked_in_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    volunteer_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    ngo_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ngo_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)

    volunteer: Mapped["Volunteer"] = relationship("Volunteer", back_populates="tasks")


class VolunteerCertificate(Base, UUIDMixin, TimestampMixin):
    """Certificates issued to volunteers on milestone completion."""

    __tablename__ = "volunteer_certificates"

    volunteer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("volunteers.id", ondelete="CASCADE")
    )
    certificate_type: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    verification_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    volunteer: Mapped["Volunteer"] = relationship("Volunteer", back_populates="certificates")


# ══════════════════════════════════════════════════════════════════════════════
# RECEIVER MODELS
# ══════════════════════════════════════════════════════════════════════════════

class HelpRequestStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    IN_PROGRESS = "in_progress"
    FULFILLED = "fulfilled"
    REJECTED = "rejected"
    EXPIRED = "expired"


class ReceiverProfile(Base, BaseModel):
    """Receiver/beneficiary profile with needs assessment."""

    __tablename__ = "receiver_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )
    family_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    monthly_income: Mapped[float | None] = mapped_column(Float, nullable=True)
    income_category: Mapped[str | None] = mapped_column(String(30), nullable=True)
    # "below_poverty_line", "low", "lower_middle"
    housing_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    primary_language: Mapped[str | None] = mapped_column(String(50), nullable=True)
    special_needs: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    assigned_ngo_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True
    )
    case_worker_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    ai_priority_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verification_documents: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])  # type: ignore[name-defined]
    help_requests: Mapped[list["HelpRequest"]] = relationship(
        "HelpRequest", back_populates="receiver"
    )


class HelpRequest(Base, BaseModel):
    """Request for assistance submitted by a receiver."""

    __tablename__ = "help_requests"
    __table_args__ = (
        Index("ix_help_req_receiver_id", "receiver_id"),
        Index("ix_help_req_status", "status"),
        Index("ix_help_req_type", "need_type"),
    )

    receiver_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("receiver_profiles.id", ondelete="CASCADE")
    )
    need_type: Mapped[str] = mapped_column(String(30), nullable=False)
    # "food", "medical", "education", "shelter", "clothes", "emergency"
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    urgency_level: Mapped[str] = mapped_column(String(20), default="normal")
    # "low", "normal", "high", "critical"
    quantity_needed: Mapped[str | None] = mapped_column(String(200), nullable=True)
    status: Mapped[HelpRequestStatus] = mapped_column(
        String(20), nullable=False, default=HelpRequestStatus.SUBMITTED
    )
    approved_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    fulfilled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    supporting_documents: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    ai_priority_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    ai_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    matched_donation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("donations.id", ondelete="SET NULL"), nullable=True
    )

    receiver: Mapped["ReceiverProfile"] = relationship(
        "ReceiverProfile", back_populates="help_requests"
    )


# ══════════════════════════════════════════════════════════════════════════════
# PAYMENT MODELS
# ══════════════════════════════════════════════════════════════════════════════

class TransactionStatus(str, Enum):
    INITIATED = "initiated"
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"
    DISPUTED = "disputed"


class PaymentGateway(str, Enum):
    STRIPE = "stripe"
    RAZORPAY = "razorpay"
    PAYPAL = "paypal"
    UPI = "upi"
    BANK_TRANSFER = "bank_transfer"


class Transaction(Base, BaseModel):
    """Financial transaction for money donations."""

    __tablename__ = "transactions"
    __table_args__ = (
        Index("ix_txn_donor_id", "donor_id"),
        Index("ix_txn_donation_id", "donation_id"),
        Index("ix_txn_status", "status"),
        Index("ix_txn_gateway", "gateway"),
        Index("ix_txn_created_at", "created_at"),
    )

    donor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT")
    )
    donation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("donations.id", ondelete="SET NULL"), nullable=True
    )
    campaign_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True
    )

    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR")
    platform_fee: Mapped[float] = mapped_column(Float, default=0.0)
    gateway_fee: Mapped[float] = mapped_column(Float, default=0.0)
    net_amount: Mapped[float] = mapped_column(Float, nullable=False)

    gateway: Mapped[PaymentGateway] = mapped_column(String(30), nullable=False)
    gateway_order_id: Mapped[str | None] = mapped_column(String(200), nullable=True, index=True)
    gateway_payment_id: Mapped[str | None] = mapped_column(String(200), nullable=True, index=True)
    gateway_signature: Mapped[str | None] = mapped_column(String(500), nullable=True)
    gateway_response: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    status: Mapped[TransactionStatus] = mapped_column(
        String(30), nullable=False, default=TransactionStatus.INITIATED
    )
    initiated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    failed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False)
    extra_metadata: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)


# ══════════════════════════════════════════════════════════════════════════════
# NOTIFICATION MODEL
# ══════════════════════════════════════════════════════════════════════════════

class Notification(Base, UUIDMixin, TimestampMixin):
    """In-app, push, email, and SMS notifications."""

    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notif_user_id", "user_id"),
        Index("ix_notif_read", "is_read"),
        Index("ix_notif_created_at", "created_at"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    notification_type: Mapped[str] = mapped_column(String(50), nullable=False)
    channel: Mapped[str] = mapped_column(String(20), default="in_app")
    # "in_app", "push", "email", "sms", "whatsapp"
    entity_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    entity_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    action_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    delivery_status: Mapped[str] = mapped_column(String(20), default="pending")
    priority: Mapped[str] = mapped_column(String(10), default="normal")
    extra_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    user: Mapped["User"] = relationship("User")  # type: ignore[name-defined]


# ══════════════════════════════════════════════════════════════════════════════
# AI RECOMMENDATION & FRAUD ALERT MODELS
# ══════════════════════════════════════════════════════════════════════════════

class AIRecommendation(Base, UUIDMixin, TimestampMixin):
    """AI-generated recommendation records for auditing and feedback."""

    __tablename__ = "ai_recommendations"

    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    recommendation_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # "ngo_match", "donation_suggestion", "need_prediction", "volunteer_task"
    input_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    output_data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    model_used: Mapped[str | None] = mapped_column(String(100), nullable=True)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    was_accepted: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)


class FraudAlert(Base, UUIDMixin, TimestampMixin):
    """AI-detected fraud and abuse alerts."""

    __tablename__ = "fraud_alerts"

    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    alert_type: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), default="medium")
    fraud_score: Mapped[float] = mapped_column(Float, nullable=False)
    flags: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False)
    details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    resolution_notes: Mapped[str | None] = mapped_column(Text, nullable=True)


# ══════════════════════════════════════════════════════════════════════════════
# SYSTEM MODELS
# ══════════════════════════════════════════════════════════════════════════════

class FeatureFlag(Base, UUIDMixin, TimestampMixin):
    """Runtime feature toggles managed from admin panel."""

    __tablename__ = "feature_flags"

    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    value: Mapped[bool] = mapped_column(Boolean, default=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    rollout_percentage: Mapped[float] = mapped_column(Float, default=100.0)
    target_roles: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    updated_by: Mapped[str | None] = mapped_column(String(36), nullable=True)


class SystemSetting(Base, UUIDMixin, TimestampMixin):
    """Key-value system settings with type information."""

    __tablename__ = "system_settings"

    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    value_type: Mapped[str] = mapped_column(String(20), default="string")
    # "string", "integer", "float", "boolean", "json"
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
