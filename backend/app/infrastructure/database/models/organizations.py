"""
CharityAI – Organization & NGO Models
"""
from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.models.base import BaseModel, TimestampMixin, UUIDMixin
from app.infrastructure.database.models.users import VerificationStatus
from app.infrastructure.database.session import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models.users import User


class OrganizationType(str, Enum):
    NGO = "ngo"
    CORPORATE = "corporate"
    GOVERNMENT = "government"
    FOUNDATION = "foundation"
    TRUST = "trust"
    SOCIETY = "society"


class OrganizationStatus(str, Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    VERIFIED = "verified"
    SUSPENDED = "suspended"
    REJECTED = "rejected"


class CampaignStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CampaignType(str, Enum):
    FUNDRAISING = "fundraising"
    FOOD_DRIVE = "food_drive"
    CLOTHES_DRIVE = "clothes_drive"
    BLOOD_DRIVE = "blood_drive"
    EDUCATION = "education"
    MEDICAL = "medical"
    DISASTER_RELIEF = "disaster_relief"
    VOLUNTEER = "volunteer"
    AWARENESS = "awareness"


# ── Organization ──────────────────────────────────────────────────────────────
class Organization(Base, BaseModel):
    """NGOs, Corporates, Government bodies — all mapped to one table."""

    __tablename__ = "organizations"
    __table_args__ = (
        UniqueConstraint("registration_number", name="uq_org_registration_number"),
        Index("ix_org_type", "org_type"),
        Index("ix_org_status", "status"),
        Index("ix_org_country", "country"),
    )

    org_type: Mapped[OrganizationType] = mapped_column(String(30), nullable=False)
    status: Mapped[OrganizationStatus] = mapped_column(
        String(30), nullable=False, default=OrganizationStatus.PENDING
    )

    # ── Identity ──────────────────────────────────────────────────────────────
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    slug: Mapped[str] = mapped_column(String(300), unique=True, nullable=False)
    tagline: Mapped[str | None] = mapped_column(String(500), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    mission: Mapped[str | None] = mapped_column(Text, nullable=True)
    vision: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Legal ─────────────────────────────────────────────────────────────────
    registration_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tax_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pan_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    fcra_number: Mapped[str | None] = mapped_column(String(50), nullable=True)  # India
    founded_year: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # ── Contact ───────────────────────────────────────────────────────────────
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    website: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # ── Address ───────────────────────────────────────────────────────────────
    address_line1: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str] = mapped_column(String(100), nullable=False, default="India")
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    # ── Media ─────────────────────────────────────────────────────────────────
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    banner_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    gallery_urls: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)

    # ── Social ────────────────────────────────────────────────────────────────
    social_links: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    # {"facebook": "...", "instagram": "...", "twitter": "...", "linkedin": "..."}

    # ── Categories & Tags ─────────────────────────────────────────────────────
    categories: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    tags: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    sdg_goals: Mapped[list[int] | None] = mapped_column(ARRAY(Integer), nullable=True)

    # ── Verification ──────────────────────────────────────────────────────────
    verification_status: Mapped[VerificationStatus] = mapped_column(
        String(20), nullable=False, default=VerificationStatus.PENDING
    )
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    kyc_completed: Mapped[bool] = mapped_column(Boolean, default=False)

    # ── Stats ─────────────────────────────────────────────────────────────────
    total_received: Mapped[float] = mapped_column(Float, default=0.0)
    total_beneficiaries: Mapped[int] = mapped_column(Integer, default=0)
    rating: Mapped[float] = mapped_column(Float, default=0.0)
    rating_count: Mapped[int] = mapped_column(Integer, default=0)
    impact_score: Mapped[int] = mapped_column(Integer, default=0)
    followers_count: Mapped[int] = mapped_column(Integer, default=0)

    # ── Banking ───────────────────────────────────────────────────────────────
    bank_account_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    bank_account_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    bank_ifsc: Mapped[str | None] = mapped_column(String(20), nullable=True)
    bank_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    upi_id: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # ── Settings ──────────────────────────────────────────────────────────────
    accepts_online_donations: Mapped[bool] = mapped_column(Boolean, default=True)
    accepts_goods_donations: Mapped[bool] = mapped_column(Boolean, default=True)
    tax_exemption_available: Mapped[bool] = mapped_column(Boolean, default=False)
    tax_exemption_section: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # ── Relationships ─────────────────────────────────────────────────────────
    members: Mapped[list["OrganizationMember"]] = relationship(
        "OrganizationMember", back_populates="organization"
    )
    documents: Mapped[list["OrganizationDocument"]] = relationship(
        "OrganizationDocument", back_populates="organization"
    )
    campaigns: Mapped[list["Campaign"]] = relationship(
        "Campaign", back_populates="organization"
    )


# ── Organization Member ───────────────────────────────────────────────────────
class OrganizationMember(Base, UUIDMixin, TimestampMixin):
    """Links users to organizations with role assignments."""

    __tablename__ = "organization_members"
    __table_args__ = (
        UniqueConstraint("organization_id", "user_id", name="uq_org_member"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    role: Mapped[str] = mapped_column(String(30), nullable=False, default="staff")
    # "admin", "staff", "volunteer", "treasurer", "secretary"
    is_primary_contact: Mapped[bool] = mapped_column(Boolean, default=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    organization: Mapped["Organization"] = relationship(
        "Organization", back_populates="members"
    )
    user: Mapped["User"] = relationship("User")


# ── Organization Document ──────────────────────────────────────────────────────
class OrganizationDocument(Base, UUIDMixin, TimestampMixin):
    """Legal and KYC documents for organizations."""

    __tablename__ = "organization_documents"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE")
    )
    document_type: Mapped[str] = mapped_column(String(80), nullable=False)
    # "registration_certificate", "80g_certificate", "fcra", "annual_report", "audited_accounts"
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    verification_status: Mapped[VerificationStatus] = mapped_column(
        String(20), nullable=False, default=VerificationStatus.PENDING
    )
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    organization: Mapped["Organization"] = relationship(
        "Organization", back_populates="documents"
    )


# ── Campaign ──────────────────────────────────────────────────────────────────
class Campaign(Base, BaseModel):
    """Fundraising and donation campaigns created by organizations."""

    __tablename__ = "campaigns"
    __table_args__ = (
        Index("ix_campaigns_org_id", "organization_id"),
        Index("ix_campaigns_status", "status"),
        Index("ix_campaigns_type", "campaign_type"),
        Index("ix_campaigns_ends_at", "ends_at"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE")
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    slug: Mapped[str] = mapped_column(String(300), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    story: Mapped[str | None] = mapped_column(Text, nullable=True)
    campaign_type: Mapped[CampaignType] = mapped_column(String(30), nullable=False)
    status: Mapped[CampaignStatus] = mapped_column(
        String(20), nullable=False, default=CampaignStatus.DRAFT
    )

    # ── Financial Goal ────────────────────────────────────────────────────────
    goal_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    raised_amount: Mapped[float] = mapped_column(Float, default=0.0)
    donors_count: Mapped[int] = mapped_column(Integer, default=0)
    currency: Mapped[str] = mapped_column(String(3), default="INR")

    # ── Timeline ──────────────────────────────────────────────────────────────
    starts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # ── Media ─────────────────────────────────────────────────────────────────
    cover_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    video_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    gallery_urls: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)

    # ── Tags & Visibility ─────────────────────────────────────────────────────
    tags: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_emergency: Mapped[bool] = mapped_column(Boolean, default=False)

    # ── Impact ────────────────────────────────────────────────────────────────
    impact_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    beneficiaries_count: Mapped[int] = mapped_column(Integer, default=0)

    # ── Relationships ─────────────────────────────────────────────────────────
    organization: Mapped["Organization"] = relationship(
        "Organization", back_populates="campaigns"
    )
    milestones: Mapped[list["CampaignMilestone"]] = relationship(
        "CampaignMilestone", back_populates="campaign", order_by="CampaignMilestone.target_amount"
    )


# ── Campaign Milestone ────────────────────────────────────────────────────────
class CampaignMilestone(Base, UUIDMixin, TimestampMixin):
    """Milestones/goals within a campaign."""

    __tablename__ = "campaign_milestones"

    campaign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="CASCADE")
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_amount: Mapped[float] = mapped_column(Float, nullable=False)
    achieved: Mapped[bool] = mapped_column(Boolean, default=False)
    achieved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="milestones")


# ══════════════════════════════════════════════════════════════════════════════
# NGO REQUIREMENT & DONATION MATCHING MODELS
# ══════════════════════════════════════════════════════════════════════════════

class RequirementStatus(str, Enum):
    OPEN = "open"
    PARTIALLY_MATCHED = "partially_matched"
    MATCHED = "matched"
    ACCEPTED = "accepted"
    FULFILLED = "fulfilled"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class RequirementUrgency(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class NGORequirement(Base, BaseModel):
    """
    An NGO's stated need/requirement for donations.
    Donors can see these and offer matching donations.
    """

    __tablename__ = "ngo_requirements"
    __table_args__ = (
        Index("ix_ngo_req_ngo_id", "ngo_id"),
        Index("ix_ngo_req_category", "category"),
        Index("ix_ngo_req_status", "status"),
        Index("ix_ngo_req_city", "city"),
        Index("ix_ngo_req_created_at", "created_at"),
    )

    ngo_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE")
    )
    created_by_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT")
    )

    # What is needed
    category: Mapped[str] = mapped_column(String(30), nullable=False)
    # "food", "money", "clothes", "medicine", "books", "education", "shelter", "electronics", "emergency"
    item_name: Mapped[str] = mapped_column(String(200), nullable=False)
    quantity: Mapped[float | None] = mapped_column(Float, nullable=True)
    unit: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "kg", "items", "INR", "liters"
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Location
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str] = mapped_column(String(100), default="India")
    address: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Priority
    urgency: Mapped[RequirementUrgency] = mapped_column(
        String(20), nullable=False, default=RequirementUrgency.MEDIUM
    )
    needed_by: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Status
    status: Mapped[RequirementStatus] = mapped_column(
        String(30), nullable=False, default=RequirementStatus.OPEN
    )

    # Matching metadata
    matched_donation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("donations.id", ondelete="SET NULL"), nullable=True
    )
    matched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    fulfilled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    ngo: Mapped["Organization"] = relationship("Organization")


class MatchStatus(str, Enum):
    REQUESTED = "requested"    # NGO requested this donation
    PENDING_DONOR = "pending_donor"  # Waiting for donor acceptance
    ACCEPTED = "accepted"      # Donor accepted the request
    REJECTED = "rejected"      # Donor rejected the request
    COMPLETED = "completed"    # Donation received
    CANCELLED = "cancelled"


class DonationMatch(Base, BaseModel):
    """
    Links a donor's donation to an NGO requirement.
    Created when an NGO requests a donation OR when system auto-matches.
    """

    __tablename__ = "donation_matches"
    __table_args__ = (
        Index("ix_match_donation_id", "donation_id"),
        Index("ix_match_requirement_id", "requirement_id"),
        Index("ix_match_ngo_id", "ngo_id"),
        Index("ix_match_status", "status"),
    )

    donation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("donations.id", ondelete="CASCADE")
    )
    requirement_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ngo_requirements.id", ondelete="SET NULL"), nullable=True
    )
    ngo_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE")
    )
    donor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )

    status: Mapped[MatchStatus] = mapped_column(
        String(30), nullable=False, default=MatchStatus.REQUESTED
    )

    # NGO message when requesting
    request_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Donor response message
    response_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    requested_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    ngo: Mapped["Organization"] = relationship("Organization")

