"""
CharityAI – Database Seed Script (PostgreSQL)
Seeds initial data: admin user, sample NGOs, sample donations, feature flags.
Run: python seed_db.py
"""
from __future__ import annotations

import asyncio
import os
import uuid
from datetime import UTC, datetime, timedelta

from app.core.config import settings
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

DB_URL = settings.get_database_url()


async def seed():
    from app.infrastructure.database.models.users import (
        User, UserProfile, UserRole, AuthProvider, AccountStatus, VerificationStatus
    )
    from app.infrastructure.database.models.organizations import (
        Organization, OrganizationType, OrganizationStatus, OrganizationMember, Campaign, CampaignStatus, CampaignType
    )
    from app.infrastructure.database.models.donations import (
        Donation, DonationItem, DonationStatus, DonationType, DonationStatusHistory
    )
    from app.infrastructure.database.models.core import FeatureFlag, Notification
    from app.core.security import hash_password

    engine = create_async_engine(DB_URL, echo=False)
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as db:
        print("[+] Seeding CharityAI PostgreSQL database...")

        # ── Admin User ────────────────────────────────────────────────────────
        admin_id = uuid.uuid4()
        admin = User(
            id=admin_id,
            email="admin@charityai.org",
            phone="+911234567890",
            hashed_password=hash_password("Admin@123456"),
            role=UserRole.SUPER_ADMIN,
            auth_provider=AuthProvider.EMAIL,
            account_status=AccountStatus.ACTIVE,
            email_verified=True,
            created_by=str(admin_id),
        )
        db.add(admin)
        db.add(UserProfile(user_id=admin_id, first_name="Admin", last_name="CharityAI"))

        # ── Donor User ────────────────────────────────────────────────────────
        donor_id = uuid.uuid4()
        donor = User(
            id=donor_id,
            email="donor@test.com",
            phone="+919876543210",
            hashed_password=hash_password("Donor@123456"),
            role=UserRole.DONOR,
            auth_provider=AuthProvider.EMAIL,
            account_status=AccountStatus.ACTIVE,
            email_verified=True,
            created_by=str(admin_id),
        )
        db.add(donor)
        db.add(UserProfile(user_id=donor_id, first_name="Ravi", last_name="Kumar",
                           city="Bangalore", state="Karnataka"))

        # ── NGO Admin User ────────────────────────────────────────────────────
        ngo_admin_id = uuid.uuid4()
        ngo_user = User(
            id=ngo_admin_id,
            email="ngo@sarvam.org",
            phone="+918765432109",
            hashed_password=hash_password("NGO@123456"),
            role=UserRole.NGO_ADMIN,
            auth_provider=AuthProvider.EMAIL,
            account_status=AccountStatus.ACTIVE,
            email_verified=True,
            created_by=str(admin_id),
        )
        db.add(ngo_user)
        db.add(UserProfile(user_id=ngo_admin_id, first_name="Priya", last_name="Sharma"))

        # ── Volunteer User ────────────────────────────────────────────────────
        vol_id = uuid.uuid4()
        volunteer_user = User(
            id=vol_id,
            email="volunteer@test.com",
            phone="+917654321098",
            hashed_password=hash_password("Vol@123456"),
            role=UserRole.VOLUNTEER,
            auth_provider=AuthProvider.EMAIL,
            account_status=AccountStatus.ACTIVE,
            email_verified=True,
            created_by=str(admin_id),
        )
        db.add(volunteer_user)
        db.add(UserProfile(user_id=vol_id, first_name="Amit", last_name="Singh",
                           city="Mumbai", state="Maharashtra"))

        await db.flush()
        print("    [x] Users: admin, donor, ngo_admin, volunteer created")

        # ── NGO Organization ──────────────────────────────────────────────────
        ngo1_id = uuid.uuid4()
        ngo1 = Organization(
            id=ngo1_id,
            org_type=OrganizationType.NGO,
            status=OrganizationStatus.VERIFIED,
            verification_status=VerificationStatus.VERIFIED,
            name="Sarvam Foundation",
            slug="sarvam-foundation",
            description="Empowering underprivileged communities through food, education, and healthcare.",
            email="contact@sarvam.org",
            phone="+918001234567",
            city="Bangalore",
            state="Karnataka",
            country="India",
            registration_number="NGO-KA-2019-001234",
            website="https://sarvam.org",
            rating=4.8,
            total_received=250000.0,
            followers_count=1250,
            created_by=str(admin_id),
        )
        db.add(ngo1)
        db.add(OrganizationMember(
            organization_id=ngo1_id, user_id=ngo_admin_id,
            role="admin", is_primary_contact=True
        ))

        ngo2_id = uuid.uuid4()
        ngo2 = Organization(
            id=ngo2_id,
            org_type=OrganizationType.NGO,
            status=OrganizationStatus.VERIFIED,
            verification_status=VerificationStatus.VERIFIED,
            name="Hunger Free India",
            slug="hunger-free-india",
            description="Fighting hunger across India through community kitchens and food drives.",
            email="info@hungerfree.in",
            phone="+918009876543",
            city="Mumbai",
            state="Maharashtra",
            country="India",
            registration_number="NGO-MH-2018-005678",
            website="https://hungerfree.in",
            rating=4.6,
            total_received=180000.0,
            followers_count=890,
            created_by=str(admin_id),
        )
        db.add(ngo2)

        ngo3_id = uuid.uuid4()
        ngo3 = Organization(
            id=ngo3_id,
            org_type=OrganizationType.NGO,
            status=OrganizationStatus.VERIFIED,
            verification_status=VerificationStatus.VERIFIED,
            name="EduBright NGO",
            slug="edubright-ngo",
            description="Providing quality education and digital literacy to rural children.",
            email="contact@edubright.org",
            phone="+918002345678",
            city="Pune",
            state="Maharashtra",
            country="India",
            registration_number="NGO-MH-2020-009012",
            website="https://edubright.org",
            rating=4.7,
            total_received=95000.0,
            followers_count=620,
            created_by=str(admin_id),
        )
        db.add(ngo3)

        await db.flush()
        print("    [x] NGOs: Sarvam Foundation, Hunger Free India, EduBright created")

        # ── Campaigns ─────────────────────────────────────────────────────────
        campaign1_id = uuid.uuid4()
        db.add(Campaign(
            id=campaign1_id,
            organization_id=ngo1_id,
            title="Winter Food Drive 2026",
            slug="winter-food-drive-2026",
            description="Provide food kits to 5000 families this winter across Karnataka.",
            campaign_type=CampaignType.FOOD_DRIVE,
            status=CampaignStatus.ACTIVE,
            goal_amount=500000.0,
            raised_amount=125000.0,
            starts_at=datetime.now(UTC) - timedelta(days=10),
            ends_at=datetime.now(UTC) + timedelta(days=50),
            created_by=str(ngo_admin_id),
        ))

        campaign2_id = uuid.uuid4()
        db.add(Campaign(
            id=campaign2_id,
            organization_id=ngo3_id,
            title="Tablet for Every Child",
            slug="tablet-for-every-child",
            description="Donate refurbished tablets to children in rural Maharashtra.",
            campaign_type=CampaignType.EDUCATION,
            status=CampaignStatus.ACTIVE,
            goal_amount=200000.0,
            raised_amount=48000.0,
            starts_at=datetime.now(UTC) - timedelta(days=5),
            ends_at=datetime.now(UTC) + timedelta(days=60),
            created_by=str(ngo_admin_id),
        ))

        await db.flush()
        print("    [x] Campaigns: 2 active campaigns created")

        # ── Sample Donations ──────────────────────────────────────────────────
        d1_id = uuid.uuid4()
        d1 = Donation(
            id=d1_id,
            donor_id=donor_id,
            ngo_id=ngo1_id,
            campaign_id=campaign1_id,
            donation_type=DonationType.FOOD,
            status=DonationStatus.VERIFIED,
            title="Rice and Dal Packets — Winter Drive",
            description="50 kg rice and 20 kg dal packets for needy families.",
            pickup_address="123 MG Road, Indiranagar",
            pickup_city="Bangalore",
            pickup_latitude=12.9716,
            pickup_longitude=77.5946,
            tracking_number="CAI-FOOD-001",
            is_anonymous=False,
            ai_fraud_score=0.05,
            created_by=str(donor_id),
        )
        db.add(d1)
        db.add(DonationItem(donation_id=d1_id, name="Rice", quantity=50, unit="kg", condition="new"))
        db.add(DonationItem(donation_id=d1_id, name="Dal", quantity=20, unit="kg", condition="new"))
        db.add(DonationStatusHistory(
            donation_id=d1_id, from_status=None,
            to_status=DonationStatus.PENDING, changed_by=str(donor_id)
        ))
        db.add(DonationStatusHistory(
            donation_id=d1_id, from_status=DonationStatus.PENDING,
            to_status=DonationStatus.VERIFIED, changed_by=str(ngo_admin_id)
        ))

        d2_id = uuid.uuid4()
        d2 = Donation(
            id=d2_id,
            donor_id=donor_id,
            ngo_id=ngo2_id,
            donation_type=DonationType.MONEY,
            status=DonationStatus.DISTRIBUTED,
            title="Monthly Food Campaign Donation",
            description="Monetary donation for community kitchen operations.",
            amount=5000.0,
            currency="INR",
            tracking_number="CAI-MON-002",
            is_anonymous=False,
            created_by=str(donor_id),
        )
        db.add(d2)
        db.add(DonationStatusHistory(
            donation_id=d2_id, from_status=None,
            to_status=DonationStatus.PENDING, changed_by=str(donor_id)
        ))

        d3_id = uuid.uuid4()
        d3 = Donation(
            id=d3_id,
            donor_id=donor_id,
            ngo_id=ngo3_id,
            campaign_id=campaign2_id,
            donation_type=DonationType.ELECTRONICS,
            status=DonationStatus.PENDING,
            title="Refurbished Laptop for Students",
            description="HP laptop (2019, 8GB RAM) for online learning.",
            pickup_address="456 Koramangala 5th Block",
            pickup_city="Bangalore",
            tracking_number="CAI-ELEC-003",
            is_anonymous=False,
            created_by=str(donor_id),
        )
        db.add(d3)
        db.add(DonationItem(donation_id=d3_id, name="HP Laptop", quantity=1, unit="piece",
                            condition="good", estimated_value=15000.0))

        await db.flush()
        print("    [x] Donations: 3 sample donations created (food, money, electronics)")

        # ── Feature Flags ─────────────────────────────────────────────────────
        flags = [
            ("ai_chatbot", True, "AI donation assistant chatbot"),
            ("biometric_login", True, "Biometric login on mobile"),
            ("disaster_mode", False, "Emergency disaster donation mode"),
            ("gamification", True, "Points, badges, leaderboard"),
            ("carbon_tracking", True, "Carbon footprint tracking"),
        ]
        for key, value, desc in flags:
            db.add(FeatureFlag(key=key, value=value, description=desc))

        # ── Notifications ─────────────────────────────────────────────────────
        db.add(Notification(
            user_id=donor_id,
            title="Welcome to CharityAI!",
            body="Thank you for joining CharityAI. Start your first donation today and make a difference.",
            notification_type="system",
        ))
        db.add(Notification(
            user_id=donor_id,
            title="Your food donation was verified",
            body="Your donation 'Rice and Dal Packets' has been verified by Sarvam Foundation.",
            notification_type="donation",
        ))

        await db.commit()
        print("    [x] Feature flags and notifications seeded")
        print()
        print("=" * 60)
        print("SUCCESS: POSTGRESQL DATABASE SEEDED SUCCESSFULLY")
        print("=" * 60)
        print()
        print("Test Credentials:")
        print("  Admin:     admin@charityai.org / Admin@123456")
        print("  Donor:     donor@test.com / Donor@123456")
        print("  NGO Admin: ngo@sarvam.org / NGO@123456")
        print("  Volunteer: volunteer@test.com / Vol@123456")
        print()
        print("Sample Data:")
        print(f"  NGOs: {ngo1_id} (Sarvam), {ngo2_id} (Hunger Free), {ngo3_id} (EduBright)")
        print(f"  Donations: {d1_id} (food), {d2_id} (money), {d3_id} (electronics)")
        print(f"  Campaigns: {campaign1_id} (Winter Food Drive), {campaign2_id} (Tablet for Child)")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
