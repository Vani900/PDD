"""
CharityAI – Users Pydantic v2 Schemas
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    display_name: Optional[str] = Field(None, max_length=150)
    phone: Optional[str] = Field(None, max_length=20)
    bio: Optional[str] = None
    gender: Optional[str] = Field(None, max_length=20)
    address_line1: Optional[str] = Field(None, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    language: Optional[str] = Field("en", max_length=10)
    timezone: Optional[str] = Field("UTC", max_length=50)
    theme: Optional[str] = Field("light", max_length=10)


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=8)


class EmailChangeRequest(BaseModel):
    new_email: EmailStr
    current_password: str


class PreferencesUpdate(BaseModel):
    email_notifications: bool = True
    push_notifications: bool = True
    sms_notifications: bool = False
    marketing_emails: bool = False
    public_profile: bool = True
    show_donation_history: bool = True


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    email: str
    phone: Optional[str] = None
    role: str
    account_status: str
    email_verified: bool
    phone_verified: bool
    first_name: str
    last_name: str
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    gender: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    impact_score: int = 0
    total_donations_count: int = 0
    total_donation_amount: float = 0.0
    volunteer_hours: float = 0.0
    level: int = 1
    language: str = "en"
    timezone: str = "UTC"
    theme: str = "light"
    notification_preferences: Optional[dict[str, Any]] = None
    completion_percentage: int = 0
    created_at: Optional[datetime] = None


class UserActivityResponse(BaseModel):
    id: str
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: Optional[datetime] = None
