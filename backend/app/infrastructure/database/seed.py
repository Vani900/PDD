"""
CharityAI – Production Database Initializer & Seed Script
Populates roles, super admin, default verified NGOs, campaigns, system settings, and feature flags.
"""
from __future__ import annotations

import asyncio
import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_password
from app.infrastructure.database.models.core import FeatureFlag, SystemSetting
from app.infrastructure.database.models.organizations import (
    Campaign,
    CampaignStatus,
    CampaignType,
    Organization,
    OrganizationStatus,
    OrganizationType,
)
from app.infrastructure.database.models.users import (
    AccountStatus,
    AuthProvider,
    User,
    UserProfile,
    UserRole,
    VerificationStatus,
)
from app.infrastructure.database.session import AsyncSessionLocal, engine


async def seed_database() -> None:
    """Execute initial database seed."""
    async with AsyncSessionLocal() as db:
        print("🌱 Seeding CharityAI database...")

        # ── 1. Super Admin User ────────────────────────────────────────────────
        admin_email = "admin@charityai.org"
        result = await db.execute(select(User).where(User.email == admin_email))
        admin_user = result.scalar_one_or_none()

        if not admin_user:
            admin_user = User(
                email=admin_email,
                hashed_password=hash_password("Admin@CharityAI2026!"),
                role=UserRole.SUPER_ADMIN,
                account_status=AccountStatus.ACTIVE,
                email_verified=True,
                auth_provider=AuthProvider.EMAIL,
            )
            db.add(admin_user)
            await db.flush()

            admin_profile = UserProfile(
                user_id=admin_user.id,
                first_name="Super",
                last_name="Admin",
                display_name="CharityAI System Admin",
                bio="System Administrator for CharityAI Platform",
                city="Bangalore",
                country="India",
                impact_score=1000,
                level=10,
            )
            db.add(admin_profile)
            print("  ✓ Created Super Admin user (admin@charityai.org)")

        # ── 2. Feature Flags ───────────────────────────────────────────────────
        flags = [
          {"key": "ai_chatbot_enabled", "value": True, "description": "Enable GPT-4o donation chatbot"},
          {"key": "crypto_donations_enabled", "value": False, "description": "Accept cryptocurrency donations"},
          {"key": "qr_verification_required", "value": True, "description": "Require QR code scan for item pickup"},
          {"key": "fcm_push_enabled", "value": True, "description": "Send Firebase push notifications"},
          {"key": "corporate_csr_module", "value": True, "description": "Enable CSR corporate portal"},
        ]

        for flag_data in flags:
            existing = await db.execute(select(FeatureFlag).where(FeatureFlag.key == flag_data["key"]))
            if not existing.scalar_one_or_none():
                flag = FeatureFlag(
                    key=flag_data["key"],
                    value=flag_data["value"],
                    description=flag_data["description"],
                    updated_by=str(admin_user.id),
                )
                db.add(flag)
        print("  ✓ Created default feature flags")

        # ── 3. System Settings ────────────────────────────────────────────────
        system_settings = [
          {"key": "platform_fee_percentage", "value": "0.0", "value_type": "float", "category": "finance", "is_public": True},
          {"key": "max_pickup_radius_km", "value": "50", "value_type": "int", "category": "operations", "is_public": True},
          {"key": "support_email", "value": "support@charityai.org", "value_type": "string", "category": "general", "is_public": True},
          {"key": "tax_exemption_80g_enabled", "value": "true", "value_type": "bool", "category": "compliance", "is_public": True},
        ]

        for s_data in system_settings:
            existing = await db.execute(select(SystemSetting).where(SystemSetting.key == s_data["key"]))
            if not existing.scalar_one_or_none():
                setting = SystemSetting(**s_data, updated_by=str(admin_user.id))
                db.add(setting)
        print("  ✓ Created default system settings")

        # ── 4. Default Verified NGOs ──────────────────────────────────────────
        sample_ngos = [
          {
            "name": "Akshaya Patra Foundation",
            "slug": "akshaya-patra",
            "tagline": "Unlimited Food for Education",
            "description": "Providing mid-day meals to millions of school children across India daily.",
            "email": "contact@akshayapatra.org",
            "phone": "+918030143400",
            "city": "Bangalore",
            "country": "India",
            "categories": ["food", "education"],
            "rating": 4.9,
            "verification_status": VerificationStatus.VERIFIED,
            "status": OrganizationStatus.VERIFIED,
          },
          {
            "name": "CRY – Child Rights and You",
            "slug": "cry-india",
            "tagline": "Ensuring Happy Children for a Better World",
            "description": "Dedicated to restoring children's rights to health, education, and protection.",
            "email": "cry@crymail.org",
            "phone": "+912223063636",
            "city": "Mumbai",
            "country": "India",
            "categories": ["education", "emergency"],
            "rating": 4.8,
            "verification_status": VerificationStatus.VERIFIED,
            "status": OrganizationStatus.VERIFIED,
          },
          {
            "name": "Goonj",
            "slug": "goonj",
            "tagline": "A Voice, An Effort",
            "description": "Turning urban material waste into a resource for rural development and dignity.",
            "email": "mail@goonj.org",
            "phone": "+911126972351",
            "city": "Delhi",
            "country": "India",
            "categories": ["clothes", "books", "disaster_relief"],
            "rating": 4.9,
            "verification_status": VerificationStatus.VERIFIED,
            "status": OrganizationStatus.VERIFIED,
          },
        ]

        for ngo_data in sample_ngos:
            existing = await db.execute(select(Organization).where(Organization.slug == ngo_data["slug"]))
            if not existing.scalar_one_or_none():
                org = Organization(
                    org_type=OrganizationType.NGO,
                    created_by=str(admin_user.id),
                    **ngo_data,
                )
                db.add(org)
                await db.flush()

                # Add a sample campaign
                campaign = Campaign(
                    organization_id=org.id,
                    title=f"{org.name} – Annual Drive 2026",
                    slug=f"{org.slug}-annual-2026",
                    description=f"Support {org.name}'s mission to help communities in need.",
                    campaign_type=CampaignType.FUNDRAISING,
                    status=CampaignStatus.ACTIVE,
                    goal_amount=1000000.0,
                    raised_amount=450000.0,
                    created_by=str(admin_user.id),
                )
                db.add(campaign)

        print("  ✓ Created default verified NGOs and campaigns")

        await db.commit()
        print("✅ Database seeding complete!")


if __name__ == "__main__":
    asyncio.run(seed_database())
