"""
CharityAI – Security Module
JWT, password hashing, OAuth2, OTP, and API key management.
"""
from __future__ import annotations

import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

import pyotp
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.core.exceptions import (
    ExpiredTokenException,
    InvalidCredentialsException,
    InvalidTokenException,
)

# ── Password Hashing ──────────────────────────────────────────────────────────
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return str(_pwd_context.hash(password))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against its bcrypt hash."""
    return bool(_pwd_context.verify(plain_password, hashed_password))


# ── JWT Token Management ──────────────────────────────────────────────────────
def create_access_token(
    subject: str,
    additional_claims: dict[str, Any] | None = None,
    expires_delta: timedelta | None = None,
) -> str:
    """Create a signed JWT access token."""
    now = datetime.now(UTC)
    expire = now + (
        expires_delta or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload: dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "access",
        "jti": secrets.token_hex(16),
    }
    if additional_claims:
        payload.update(additional_claims)
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(subject: str) -> str:
    """Create a signed JWT refresh token with longer expiry."""
    now = datetime.now(UTC)
    expire = now + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    payload: dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "refresh",
        "jti": secrets.token_hex(32),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str, expected_type: str = "access") -> dict[str, Any]:
    """
    Decode and validate a JWT token.
    Raises InvalidTokenException or ExpiredTokenException on failure.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except JWTError as exc:
        if "expired" in str(exc).lower():
            raise ExpiredTokenException() from exc
        raise InvalidTokenException() from exc

    if payload.get("type") != expected_type:
        raise InvalidTokenException(f"Expected token type '{expected_type}'")

    return payload


def get_subject_from_token(token: str, token_type: str = "access") -> str:
    """Extract and return the 'sub' claim from a validated JWT."""
    payload = decode_token(token, expected_type=token_type)
    subject = payload.get("sub")
    if not subject:
        raise InvalidTokenException("Token missing subject claim")
    return str(subject)


# ── OTP (TOTP / Email / SMS) ──────────────────────────────────────────────────
def generate_totp_secret() -> str:
    """Generate a TOTP secret for 2FA setup."""
    return pyotp.random_base32()


def verify_totp(secret: str, otp_code: str) -> bool:
    """Verify a TOTP code against a stored secret."""
    totp = pyotp.TOTP(secret)
    return totp.verify(otp_code, valid_window=1)


def get_totp_provisioning_uri(secret: str, email: str) -> str:
    """Get the TOTP URI for QR code generation."""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=email, issuer_name=settings.APP_NAME)


def generate_numeric_otp(length: int = 6) -> str:
    """Generate a cryptographically secure numeric OTP."""
    return "".join([str(secrets.randbelow(10)) for _ in range(length)])


def generate_secure_token(length: int = 32) -> str:
    """Generate a URL-safe secure random token."""
    return secrets.token_urlsafe(length)


# ── API Key Management ────────────────────────────────────────────────────────
def generate_api_key() -> tuple[str, str]:
    """
    Generate an API key and its hash.
    Returns (plain_key, hashed_key).
    The plain key is shown ONCE to the user; only the hash is stored.
    """
    plain_key = f"cai_{secrets.token_urlsafe(32)}"
    hashed_key = hash_password(plain_key)
    return plain_key, hashed_key


def verify_api_key(plain_key: str, hashed_key: str) -> bool:
    """Verify an API key against its stored hash."""
    return verify_password(plain_key, hashed_key)


# ── Constant-Time Comparison ──────────────────────────────────────────────────
def constant_time_compare(val1: str, val2: str) -> bool:
    """Compare two strings in constant time to prevent timing attacks."""
    return secrets.compare_digest(val1.encode(), val2.encode())
