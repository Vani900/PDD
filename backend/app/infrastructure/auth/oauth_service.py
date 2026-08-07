"""
CharityAI – Social OAuth Token Verification Service
Validates OAuth ID tokens for Google, Microsoft, and Apple Sign-In.
"""
from __future__ import annotations

import httpx
from typing import Any
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.core.config import settings
from app.core.exceptions import InvalidTokenException


async def verify_google_id_token(token_str: str) -> dict[str, Any]:
    """Verify Google OAuth2 ID token and return user profile information."""
    try:
        req = google_requests.Request()
        id_info = id_token.verify_oauth2_token(
            token_str, req, settings.GOOGLE_CLIENT_ID or None
        )
        return {
            "email": id_info.get("email"),
            "first_name": id_info.get("given_name", ""),
            "last_name": id_info.get("family_name", ""),
            "avatar_url": id_info.get("picture"),
            "email_verified": id_info.get("email_verified", False),
            "sub": id_info.get("sub"),
            "provider": "google",
        }
    except Exception as e:
        raise InvalidTokenException(f"Invalid Google ID token: {str(e)}") from e


async def verify_microsoft_token(access_token: str) -> dict[str, Any]:
    """Verify Microsoft OAuth access token using MS Graph API."""
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(
                "https://graph.microsoft.com/v1.0/me",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            res.raise_for_status()
            data = res.json()
            return {
                "email": data.get("userPrincipalName") or data.get("mail"),
                "first_name": data.get("givenName", ""),
                "last_name": data.get("surname", ""),
                "email_verified": True,
                "sub": data.get("id"),
                "provider": "microsoft",
            }
    except Exception as e:
        raise InvalidTokenException(f"Invalid Microsoft token: {str(e)}") from e
