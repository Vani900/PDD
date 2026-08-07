"""
CharityAI – Donation Models
Covers all donation types: food, money, clothes, medicine, blood, education, etc.
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

from app.infrastructure.database.models.base import BaseModel, UUIDMixin, TimestampMixin
from app.infrastructure.database.session import Base


class DonationType(str, Enum):
    FOOD = "food"
    MONEY = "money"
    CLOTHES = "clothes"
    MEDICINE = "medicine"
    BLOOD = "blood"
    BOOKS = "books"
    EDUCATION = "education"
    FURNITURE = "furniture"
    ELECTRONICS = "electronics"
    SHELTER = "shelter"
    EMERGENCY = "emergency"
    OTHER = "other"


class DonationStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    SCHEDULED = "scheduled"
    PICKUP_ARRANGED = "pickup_arranged"
    IN_TRANSIT = "in_transit"
    RECEIVED = "received"
    VERIFIED = "verified"
    DISTRIBUTED = "distributed"
    CANCELLED = "cancelled"
    REJECTED = "rejected"
    EXPIRED = "expired"


class DonationMethod(str, Enum):
    PICKUP = "pickup"
    DROP_OFF = "drop_off"
    DELIVERY = "delivery"
    ONLINE_TRANSFER = "online_transfer"
    UPI = "upi"


class BloodGroup(str, Enum):
    A_POS = "A+"
    A_NEG = "A-"
    B_POS = "B+"
    B_NEG = "B-"
    AB_POS = "AB+"
    AB_NEG = "AB-"
    O_POS = "O+"
    O_NEG = "O-"


# ── Donation ──────────────────────────────────────────────────────────────────
class Donation(Base, BaseModel):
    """
    Master donation record. Each donation has a type and
    can have multiple items, a pickup, receipts, and tracking.
    """

    __tablename__ = "donations"
    __table_args__ = (
        Index("ix_donations_donor_id", "donor_id"),
        Index("ix_donations_ngo_id", "ngo_id"),
        Index("ix_donations_type", "donation_type"),
        Index("ix_donations_status", "status"),
        Index("ix_donations_created_at", "created_at"),
        Index("ix_donations_campaign_id", "campaign_id"),
    )

    # ── Parties ───────────────────────────────────────────────────────────────
    donor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT")
    )
    ngo_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True
    )
    campaign_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True
    )
    volunteer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # ── Type & Status ─────────────────────────────────────────────────────────
    donation_type: Mapped[DonationType] = mapped_column(String(20), nullable=False)
    status: Mapped[DonationStatus] = mapped_column(
        String(30), nullable=False, default=DonationStatus.PENDING
    )
    donation_method: Mapped[DonationMethod] = mapped_column(
        String(30), nullable=False, default=DonationMethod.PICKUP
    )

    # ── Title & Notes ─────────────────────────────────────────────────────────
    title: Mapped[str | None] = mapped_column(String(300), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    special_instructions: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Financial (for money donations) ───────────────────────────────────────
    amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String(3), default="INR")
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False)
    is_tax_exempt: Mapped[bool] = mapped_column(Boolean, default=False)

    # ── Location ──────────────────────────────────────────────────────────────
    pickup_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    pickup_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    pickup_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    pickup_city: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # ── Scheduling ────────────────────────────────────────────────────────────
    scheduled_pickup_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    scheduled_window_start: Mapped[str | None] = mapped_column(String(10), nullable=True)
    scheduled_window_end: Mapped[str | None] = mapped_column(String(10), nullable=True)
    actual_pickup_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Verification ──────────────────────────────────────────────────────────
    qr_code: Mapped[str | None] = mapped_column(String(200), nullable=True)
    qr_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    qr_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    ngo_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    ngo_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    ngo_verified_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Media ─────────────────────────────────────────────────────────────────
    images: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    receipt_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # ── AI ────────────────────────────────────────────────────────────────────
    ai_fraud_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    ai_fraud_flags: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    ai_duplicate_of: Mapped[str | None] = mapped_column(String(36), nullable=True)
    ai_recommended_ngo: Mapped[str | None] = mapped_column(String(36), nullable=True)

    # ── Tracking ──────────────────────────────────────────────────────────────
    tracking_number: Mapped[str | None] = mapped_column(String(50), nullable=True, unique=True)
    impact_points: Mapped[int] = mapped_column(Integer, default=0)

    # ── Relationships ─────────────────────────────────────────────────────────
    donor: Mapped["User"] = relationship("User", foreign_keys=[donor_id])  # type: ignore[name-defined]
    items: Mapped[list["DonationItem"]] = relationship(
        "DonationItem", back_populates="donation", cascade="all, delete-orphan"
    )
    pickups: Mapped[list["DonationPickup"]] = relationship(
        "DonationPickup", back_populates="donation"
    )
    receipts: Mapped[list["DonationReceipt"]] = relationship(
        "DonationReceipt", back_populates="donation"
    )
    status_history: Mapped[list["DonationStatusHistory"]] = relationship(
        "DonationStatusHistory", back_populates="donation",
        order_by="DonationStatusHistory.created_at"
    )


# ── Donation Item ─────────────────────────────────────────────────────────────
class DonationItem(Base, UUIDMixin, TimestampMixin):
    """Line items for goods donations (food, clothes, books, etc.)."""

    __tablename__ = "donation_items"

    donation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("donations.id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    quantity: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    unit: Mapped[str | None] = mapped_column(String(30), nullable=True)  # "kg", "pieces", "boxes"
    condition: Mapped[str | None] = mapped_column(String(30), nullable=True)
    # "new", "good", "fair", "poor"
    estimated_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    expiry_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ai_classification: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    donation: Mapped["Donation"] = relationship("Donation", back_populates="items")


# ── Donation Pickup ────────────────────────────────────────────────────────────
class DonationPickup(Base, UUIDMixin, TimestampMixin):
    """Pickup scheduling and volunteer assignment for physical donations."""

    __tablename__ = "donation_pickups"

    donation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("donations.id", ondelete="CASCADE")
    )
    volunteer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    pickup_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    pickup_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    pickup_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    route_optimized: Mapped[bool] = mapped_column(Boolean, default=False)
    estimated_distance_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    estimated_duration_mins: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="pending")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    qr_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    donation: Mapped["Donation"] = relationship("Donation", back_populates="pickups")


# ── Donation Receipt ──────────────────────────────────────────────────────────
class DonationReceipt(Base, UUIDMixin, TimestampMixin):
    """Tax receipts and acknowledgement documents for donations."""

    __tablename__ = "donation_receipts"

    donation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("donations.id", ondelete="CASCADE")
    )
    receipt_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    receipt_type: Mapped[str] = mapped_column(String(30), nullable=False)
    # "tax_receipt", "acknowledgement", "certificate"
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    financial_year: Mapped[str | None] = mapped_column(String(10), nullable=True)
    sent_email: Mapped[bool] = mapped_column(Boolean, default=False)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    donation: Mapped["Donation"] = relationship("Donation", back_populates="receipts")


# ── Donation Status History ────────────────────────────────────────────────────
class DonationStatusHistory(Base, UUIDMixin, TimestampMixin):
    """Immutable status change history for every donation."""

    __tablename__ = "donation_status_history"

    donation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("donations.id", ondelete="CASCADE")
    )
    from_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    to_status: Mapped[str] = mapped_column(String(30), nullable=False)
    changed_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    donation: Mapped["Donation"] = relationship("Donation", back_populates="status_history")


# ── Blood Donation ─────────────────────────────────────────────────────────────
class BloodDonation(Base, BaseModel):
    """Specialized blood donation records."""

    __tablename__ = "blood_donations"
    __table_args__ = (
        Index("ix_blood_donor_id", "donor_id"),
        Index("ix_blood_group", "blood_group"),
        Index("ix_blood_city", "city"),
    )

    donor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT")
    )
    blood_group: Mapped[BloodGroup] = mapped_column(String(5), nullable=False)
    units: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    last_donation_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    next_eligible_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    hospital_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    health_screening_passed: Mapped[bool] = mapped_column(Boolean, default=False)
    certificate_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")

    donor: Mapped["User"] = relationship("User")  # type: ignore[name-defined]
