"""
CharityAI – Database Migration Endpoint
Runs safe schema migrations (ADD COLUMN IF NOT EXISTS) against the live database.
Only accessible with the admin secret key.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.infrastructure.database.session import get_db

router = APIRouter(prefix="/migrate", tags=["Migration"])


MIGRATIONS = [
    # ── users table ──────────────────────────────────────────────────────────
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password VARCHAR(72)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(30) NOT NULL DEFAULT 'donor'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'email'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_providers JSONB",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(30) NOT NULL DEFAULT 'active'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS identity_verified VARCHAR(20) NOT NULL DEFAULT 'unverified'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_2fa_enabled BOOLEAN DEFAULT FALSE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(64)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_id UUID REFERENCES users(id)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS metadata JSONB",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by VARCHAR(36)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36)",
    # ── user_profiles table ───────────────────────────────────────────────────
    "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS first_name VARCHAR(100) NOT NULL DEFAULT ''",
    "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_name VARCHAR(100) NOT NULL DEFAULT ''",
    "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS display_name VARCHAR(150)",
    "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bio TEXT",
    "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500)",
    "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS date_of_birth TIMESTAMPTZ",
    "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(20)",
    "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255)",
    "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255)",
    "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS city VARCHAR(100)",
    "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS state VARCHAR(100)",
    "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS country VARCHAR(100)",
    "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20)",
    "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS latitude FLOAT",
    "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS longitude FLOAT",
    "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS impact_score INTEGER DEFAULT 0",
    "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS total_donations_count INTEGER DEFAULT 0",
    "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS total_donation_amount FLOAT DEFAULT 0.0",
    "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS volunteer_hours FLOAT DEFAULT 0.0",
    "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS badges TEXT[]",
    "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1",
    "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en'",
    "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC'",
    "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB",
    "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS theme VARCHAR(10) DEFAULT 'light'",
    # ── donations table ────────────────────────────────────────────────────────
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS title VARCHAR(200)",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS description TEXT",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS donation_type VARCHAR(30) NOT NULL DEFAULT 'other'",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'pending'",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(50)",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS amount FLOAT",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR'",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS pickup_address TEXT",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS pickup_city VARCHAR(100)",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS pickup_state VARCHAR(100)",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS pickup_country VARCHAR(100) DEFAULT 'India'",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS pickup_postal_code VARCHAR(20)",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS pickup_latitude FLOAT",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS pickup_longitude FLOAT",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS scheduled_pickup_at TIMESTAMPTZ",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS ai_category VARCHAR(50)",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS ai_confidence FLOAT",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS ai_tags JSONB",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS ngo_id UUID",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS campaign_id UUID",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS donor_id UUID",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS recurring_interval VARCHAR(20)",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS tax_exemption_requested BOOLEAN DEFAULT FALSE",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS qr_code_url VARCHAR(500)",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36)",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS created_by VARCHAR(36)",
    "ALTER TABLE donations ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36)",
]


@router.post("/run", summary="Run database migrations (admin only)")
async def run_migrations(
    secret: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Run ALTER TABLE ADD COLUMN IF NOT EXISTS migrations safely."""
    if secret != settings.APP_SECRET_KEY:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid secret key")

    results = []
    errors = []

    for sql in MIGRATIONS:
        try:
            await db.execute(text(sql))
            results.append({"sql": sql[:60] + "...", "status": "ok"})
        except Exception as e:
            errors.append({"sql": sql[:60] + "...", "error": str(e)[:100]})

    try:
        await db.commit()
    except Exception as e:
        errors.append({"sql": "COMMIT", "error": str(e)})

    return {
        "migrations_run": len(results),
        "errors": len(errors),
        "results": results,
        "error_details": errors,
    }


@router.get("/status", summary="Check database table existence")
async def migration_status(
    secret: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Check which core tables exist in the live database."""
    if secret != settings.APP_SECRET_KEY:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid secret key")

    tables_to_check = [
        "users", "user_profiles", "refresh_tokens", "otp_verifications",
        "user_sessions", "user_documents", "audit_logs",
        "donations", "donation_items", "donation_pickups",
        "organizations", "ngo_requirements", "notifications",
    ]

    table_status = {}
    for table in tables_to_check:
        try:
            result = await db.execute(
                text(f"SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '{table}'")
            )
            exists = result.scalar() > 0
            if exists:
                count_result = await db.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = count_result.scalar()
                table_status[table] = {"exists": True, "rows": count}
            else:
                table_status[table] = {"exists": False, "rows": 0}
        except Exception as e:
            table_status[table] = {"exists": False, "error": str(e)[:100]}

    return {"tables": table_status}
