"""
CharityAI – Custom Exception Hierarchy
Structured exceptions mapping to HTTP status codes.
"""
from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status


class CharityAIException(Exception):
    """Base exception for all application errors."""

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    error_code: str = "INTERNAL_ERROR"
    message: str = "An unexpected error occurred."

    def __init__(self, message: str | None = None, details: Any = None) -> None:
        self.message = message or self.__class__.message
        self.details = details
        super().__init__(self.message)

    def to_http_exception(self) -> HTTPException:
        return HTTPException(
            status_code=self.status_code,
            detail={
                "error_code": self.error_code,
                "message": self.message,
                "details": self.details,
            },
        )


# ── Authentication & Authorization ────────────────────────────────────────────
class AuthenticationException(CharityAIException):
    status_code = status.HTTP_401_UNAUTHORIZED
    error_code = "AUTHENTICATION_FAILED"
    message = "Authentication failed."


class InvalidCredentialsException(AuthenticationException):
    error_code = "INVALID_CREDENTIALS"
    message = "Invalid email or password."


class InvalidTokenException(AuthenticationException):
    error_code = "INVALID_TOKEN"
    message = "Token is invalid or malformed."


class ExpiredTokenException(AuthenticationException):
    error_code = "TOKEN_EXPIRED"
    message = "Token has expired."


class TokenRevokedException(AuthenticationException):
    error_code = "TOKEN_REVOKED"
    message = "Token has been revoked."


class InsufficientPermissionsException(CharityAIException):
    status_code = status.HTTP_403_FORBIDDEN
    error_code = "INSUFFICIENT_PERMISSIONS"
    message = "You do not have permission to perform this action."


class AccountNotVerifiedException(AuthenticationException):
    error_code = "ACCOUNT_NOT_VERIFIED"
    message = "Your account has not been verified. Please check your email."


class AccountSuspendedException(AuthenticationException):
    error_code = "ACCOUNT_SUSPENDED"
    message = "Your account has been suspended. Contact support."


class TwoFactorRequiredException(AuthenticationException):
    status_code = status.HTTP_202_ACCEPTED
    error_code = "2FA_REQUIRED"
    message = "Two-factor authentication is required."


class InvalidOTPException(AuthenticationException):
    error_code = "INVALID_OTP"
    message = "OTP is invalid or has expired."


# ── Resource Exceptions ───────────────────────────────────────────────────────
class NotFoundException(CharityAIException):
    status_code = status.HTTP_404_NOT_FOUND
    error_code = "NOT_FOUND"
    message = "The requested resource was not found."


class UserNotFoundException(NotFoundException):
    error_code = "USER_NOT_FOUND"
    message = "User not found."


class DonationNotFoundException(NotFoundException):
    error_code = "DONATION_NOT_FOUND"
    message = "Donation not found."


class NGONotFoundException(NotFoundException):
    error_code = "NGO_NOT_FOUND"
    message = "NGO not found."


class OrganizationNotFoundException(NotFoundException):
    error_code = "ORGANIZATION_NOT_FOUND"
    message = "Organization not found."


# ── Validation & Business Logic ───────────────────────────────────────────────
class ValidationException(CharityAIException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    error_code = "VALIDATION_ERROR"
    message = "Validation failed."


class DuplicateException(CharityAIException):
    status_code = status.HTTP_409_CONFLICT
    error_code = "DUPLICATE_RESOURCE"
    message = "Resource already exists."


class EmailAlreadyExistsException(DuplicateException):
    error_code = "EMAIL_ALREADY_EXISTS"
    message = "An account with this email already exists."


class PhoneAlreadyExistsException(DuplicateException):
    error_code = "PHONE_ALREADY_EXISTS"
    message = "An account with this phone number already exists."


class BusinessRuleViolationException(CharityAIException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    error_code = "BUSINESS_RULE_VIOLATION"
    message = "Business rule violation."


# ── Payment Exceptions ────────────────────────────────────────────────────────
class PaymentException(CharityAIException):
    status_code = status.HTTP_402_PAYMENT_REQUIRED
    error_code = "PAYMENT_FAILED"
    message = "Payment processing failed."


class PaymentGatewayException(PaymentException):
    error_code = "PAYMENT_GATEWAY_ERROR"
    message = "Payment gateway error. Please try again."


# ── File / Storage Exceptions ─────────────────────────────────────────────────
class FileUploadException(CharityAIException):
    status_code = status.HTTP_400_BAD_REQUEST
    error_code = "FILE_UPLOAD_FAILED"
    message = "File upload failed."


class FileSizeTooLargeException(FileUploadException):
    error_code = "FILE_TOO_LARGE"
    message = "File size exceeds the maximum allowed limit."


class UnsupportedFileTypeException(FileUploadException):
    error_code = "UNSUPPORTED_FILE_TYPE"
    message = "File type is not supported."


# ── Rate Limiting ─────────────────────────────────────────────────────────────
class RateLimitExceededException(CharityAIException):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    error_code = "RATE_LIMIT_EXCEEDED"
    message = "Too many requests. Please slow down."


# ── External Service Exceptions ───────────────────────────────────────────────
class ExternalServiceException(CharityAIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    error_code = "EXTERNAL_SERVICE_ERROR"
    message = "External service is temporarily unavailable."


class AIServiceException(ExternalServiceException):
    error_code = "AI_SERVICE_ERROR"
    message = "AI service is temporarily unavailable."


class NotificationException(ExternalServiceException):
    error_code = "NOTIFICATION_ERROR"
    message = "Failed to send notification."


# ── Fraud & Abuse ─────────────────────────────────────────────────────────────
class FraudDetectedException(CharityAIException):
    status_code = status.HTTP_403_FORBIDDEN
    error_code = "FRAUD_DETECTED"
    message = "Suspicious activity detected. This request has been flagged."


class SpamDetectedException(CharityAIException):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    error_code = "SPAM_DETECTED"
    message = "Duplicate or spam submission detected."
