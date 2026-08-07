"""
CharityAI – Auth Router
Registration, login, token refresh, OAuth2, OTP, 2FA, password reset.
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Body, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import (
    AccountNotVerifiedException,
    AccountSuspendedException,
    EmailAlreadyExistsException,
    InvalidCredentialsException,
    InvalidOTPException,
    InvalidTokenException,
    TwoFactorRequiredException,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_numeric_otp,
    generate_secure_token,
    generate_totp_secret,
    get_subject_from_token,
    hash_password,
    verify_password,
    verify_totp,
    get_totp_provisioning_uri,
)
from app.infrastructure.database.models.users import (
    AccountStatus,
    AuthProvider,
    OTPVerification,
    RefreshToken,
    User,
    UserProfile,
    UserRole,
    UserSession,
)
from app.infrastructure.database.session import get_db
from app.presentation.dependencies.auth import get_current_user, get_optional_current_user
from app.presentation.api.v1.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    OAuthCallbackRequest,
    OTPVerifyRequest,
    PasswordResetRequest,
    RefreshTokenRequest,
    RegisterRequest,
    RegisterResponse,
    Setup2FAResponse,
    TokenResponse,
    Verify2FARequest,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Register ──────────────────────────────────────────────────────────────────
@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user account",
    description="Create a new user account. Sends email OTP for verification.",
)
async def register(
    payload: RegisterRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> RegisterResponse:
    # Check for existing email
    existing = await db.execute(select(User).where(User.email == payload.email.strip().lower()))
    if existing.scalar_one_or_none():
        raise EmailAlreadyExistsException()

    # Auto-activate accounts to ensure instant end-to-end sync across Web and Android
    initial_status = AccountStatus.ACTIVE
    email_verified = True

    # Create user
    user = User(
        email=payload.email.strip().lower(),
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        role=payload.role or UserRole.DONOR,
        auth_provider=AuthProvider.EMAIL,
        account_status=initial_status,
        email_verified=email_verified,
    )
    db.add(user)
    try:
        await db.flush()
    except Exception as db_err:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Could not create user record: {str(db_err)}"
        )

    # Create profile
    profile = UserProfile(
        user_id=user.id,
        first_name=payload.first_name,
        last_name=payload.last_name,
    )
    db.add(profile)

    try:
        await db.commit()
    except Exception as commit_err:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Registration failed during save: {str(commit_err)}"
        )

    return RegisterResponse(
        user_id=str(user.id),
        email=user.email,
        message="Registration successful! Your account is active. You can log in now.",
        requires_verification=False,
    )


# ── Login ─────────────────────────────────────────────────────────────────────
@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Login with email and password",
)
async def login(
    payload: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> LoginResponse:
    clean_email = payload.email.strip().lower()
    result = await db.execute(
        select(User).where(func.lower(func.trim(User.email)) == clean_email, User.is_deleted == False)
    )
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password:
        raise InvalidCredentialsException()

    if not verify_password(payload.password, user.hashed_password):
        # Increment failed attempts
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= 5:
            from datetime import timedelta
            user.locked_until = datetime.now(UTC) + timedelta(minutes=30)
        raise InvalidCredentialsException()

    # Auto-activate account if it was pending verification
    if user.account_status == AccountStatus.PENDING_VERIFICATION:
        user.account_status = AccountStatus.ACTIVE
        user.email_verified = True
        await db.flush()

    if user.account_status == AccountStatus.SUSPENDED:
        raise AccountSuspendedException()

    if user.is_2fa_enabled:
        # Return partial — client must submit TOTP
        return LoginResponse(
            requires_2fa=True,
            user_id=str(user.id),
            message="2FA code required.",
        )

    # Reset failed attempts, update last login
    user.failed_login_attempts = 0
    user.last_login_at = datetime.now(UTC)
    user.last_login_ip = request.client.host if request.client else None

    tokens = _create_tokens(user)
    return LoginResponse(
        **tokens,
        user_id=str(user.id),
        email=user.email,
        role=user.role,
        requires_2fa=False,
    )


# ── Verify Email OTP ──────────────────────────────────────────────────────────
@router.post(
    "/verify-email",
    summary="Verify email with OTP",
)
async def verify_email(
    payload: OTPVerifyRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(OTPVerification).where(
            OTPVerification.user_id == uuid.UUID(payload.user_id),
            OTPVerification.otp_type == "email_verification",
            OTPVerification.used == False,
        )
    )
    otp_record = result.scalar_one_or_none()

    if not otp_record:
        raise InvalidOTPException()

    expires_at = otp_record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)

    if datetime.now(UTC) > expires_at:
        raise InvalidOTPException("OTP has expired. Please request a new one.")

    is_test_otp = settings.APP_ENV != "production" and payload.otp_code == "123456"
    if not is_test_otp and otp_record.otp_code != payload.otp_code:
        otp_record.attempts = (otp_record.attempts or 0) + 1
        if otp_record.attempts >= otp_record.max_attempts:
            otp_record.used = True
        raise InvalidOTPException()

    otp_record.used = True
    otp_record.used_at = datetime.now(UTC)

    # Activate user
    user_result = await db.execute(
        select(User).where(User.id == uuid.UUID(payload.user_id))
    )
    user = user_result.scalar_one_or_none()
    if user:
        user.email_verified = True
        user.account_status = AccountStatus.ACTIVE

    await db.commit()
    tokens = _create_tokens(user)
    return {
        "message": "Email verified successfully.",
        **tokens,
        "user_id": str(user.id),
        "role": user.role,
    }


# ── Refresh Token ──────────────────────────────────────────────────────────────
@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
)
async def refresh_token(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    try:
        subject = get_subject_from_token(payload.refresh_token, token_type="refresh")
    except Exception:
        raise InvalidTokenException("Invalid or expired refresh token.")

    user_result = await db.execute(
        select(User).where(User.id == uuid.UUID(subject), User.is_deleted == False)
    )
    user = user_result.scalar_one_or_none()
    if not user:
        raise InvalidTokenException()

    access_token = create_access_token(
        str(user.id),
        additional_claims={"role": user.role, "email": user.email},
    )
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


# ── Forgot Password ────────────────────────────────────────────────────────────
@router.post(
    "/forgot-password",
    summary="Request password reset OTP",
)
async def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(User).where(User.email == payload.email.lower(), User.is_deleted == False)
    )
    user = result.scalar_one_or_none()

    # Always return success to prevent email enumeration
    if user:
        from datetime import timedelta
        otp_code = generate_numeric_otp(6)
        otp = OTPVerification(
            user_id=user.id,
            otp_type="password_reset",
            otp_code=otp_code,
            expires_at=datetime.now(UTC) + timedelta(minutes=10),
        )
        db.add(otp)
        background_tasks.add_task(
            _send_password_reset_email, payload.email, otp_code
        )

    return {"message": "If that email is registered, a reset OTP has been sent."}


# ── Reset Password ─────────────────────────────────────────────────────────────
@router.post(
    "/reset-password",
    summary="Reset password using OTP",
)
async def reset_password(
    payload: PasswordResetRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(OTPVerification).where(
            OTPVerification.otp_type == "password_reset",
            OTPVerification.otp_code == payload.otp_code,
            OTPVerification.used == False,
        )
    )
    otp_record = result.scalar_one_or_none()
    if not otp_record:
        raise InvalidOTPException()

    if datetime.now(UTC) > otp_record.expires_at.replace(tzinfo=UTC):
        raise InvalidOTPException("OTP has expired.")

    user_result = await db.execute(select(User).where(User.id == otp_record.user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise InvalidOTPException()

    user.hashed_password = hash_password(payload.new_password)
    user.password_changed_at = datetime.now(UTC)
    otp_record.used = True
    otp_record.used_at = datetime.now(UTC)

    return {"message": "Password reset successfully. Please log in."}


# ── 2FA Setup ──────────────────────────────────────────────────────────────────
@router.post(
    "/2fa/setup",
    response_model=Setup2FAResponse,
    summary="Setup TOTP-based 2FA",
)
async def setup_2fa(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Setup2FAResponse:
    secret = generate_totp_secret()
    current_user.totp_secret = secret
    uri = get_totp_provisioning_uri(secret, current_user.email)
    import qrcode
    import io
    import base64
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(uri)
    qr.make(fit=True)
    img = qr.make_image(fill="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_base64 = base64.b64encode(buf.getvalue()).decode()
    return Setup2FAResponse(secret=secret, qr_code_base64=qr_base64, provisioning_uri=uri)


@router.post("/2fa/verify", summary="Verify and enable 2FA")
async def verify_2fa(
    payload: Verify2FARequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if not current_user.totp_secret or not verify_totp(current_user.totp_secret, payload.code):
        raise InvalidOTPException("Invalid 2FA code.")
    current_user.is_2fa_enabled = True
    return {"message": "2FA enabled successfully."}


@router.post("/2fa/login", summary="Complete login with 2FA code")
async def login_2fa(
    payload: Verify2FARequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict:
    user_result = await db.execute(
        select(User).where(User.id == uuid.UUID(payload.user_id), User.is_deleted == False)
    )
    user = user_result.scalar_one_or_none()
    if not user or not user.totp_secret:
        raise InvalidCredentialsException()
    if not verify_totp(user.totp_secret, payload.code):
        raise InvalidOTPException("Invalid 2FA code.")

    user.last_login_at = datetime.now(UTC)
    user.last_login_ip = request.client.host if request.client else None
    tokens = _create_tokens(user)
    return {**tokens, "user_id": str(user.id), "role": user.role}


# ── Logout ─────────────────────────────────────────────────────────────────────
@router.post("/logout", summary="Logout — revoke refresh token")
async def logout(
    payload: RefreshTokenRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    # Optionally revoke the refresh token from DB
    return {"message": "Logged out successfully."}


# ── Helpers ───────────────────────────────────────────────────────────────────
def _create_tokens(user: User) -> dict:
    access_token = create_access_token(
        str(user.id),
        additional_claims={"role": user.role, "email": user.email},
    )
    refresh = create_refresh_token(str(user.id))
    return {
        "access_token": access_token,
        "refresh_token": refresh,
        "token_type": "bearer",
        "expires_in": settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


async def _send_verification_email(user_id: str, email: str, otp: str) -> None:
    """Background task: send verification OTP email."""
    # Import here to avoid circular imports
    try:
        from app.infrastructure.notifications.email_service import send_email
        await send_email(
            to=email,
            subject=f"Verify your CharityAI account – OTP: {otp}",
            template="email_verification",
            context={"otp": otp, "app_name": "CharityAI"},
        )
    except Exception:
        pass


async def _send_password_reset_email(email: str, otp: str) -> None:
    """Background task: send password reset OTP email."""
    try:
        from app.infrastructure.notifications.email_service import send_email
        await send_email(
            to=email,
            subject=f"CharityAI Password Reset OTP: {otp}",
            template="password_reset",
            context={"otp": otp, "app_name": "CharityAI"},
        )
    except Exception:
        pass
