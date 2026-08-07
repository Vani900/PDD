"""
CharityAI – PayPal Payment Adapter
PayPal REST SDK v2 integration for global donations, order creation, capture, and webhooks.
"""
from __future__ import annotations

import httpx
from typing import Any

from app.core.config import settings


class PayPalPaymentService:
    """PayPal v2 Payments integration service."""

    def __init__(self) -> None:
        self.base_url = (
            "https://api-m.sandbox.paypal.com"
            if settings.APP_ENV != "production"
            else "https://api-m.paypal.com"
        )
        self.client_id = settings.PAYPAL_CLIENT_ID
        self.client_secret = settings.PAYPAL_CLIENT_SECRET

    async def _get_access_token(self) -> str:
        """Fetch OAuth2 token from PayPal."""
        if not self.client_id or not self.client_secret:
            raise ValueError("PayPal credentials not configured.")

        async with httpx.AsyncClient() as client:
            res = await client.post(
                f"{self.base_url}/v1/oauth2/token",
                auth=(self.client_id, self.client_secret),
                data={"grant_type": "client_credentials"},
                headers={"Accept": "application/json", "Accept-Language": "en_US"},
            )
            res.raise_for_status()
            return res.json()["access_token"]

    async def create_order(self, amount: float, currency: str = "USD", return_url: str = "", cancel_url: str = "") -> dict[str, Any]:
        """Create a PayPal checkout order."""
        token = await self._get_access_token()
        payload = {
            "intent": "CAPTURE",
            "purchase_units": [{
                "amount": {
                    "currency_code": currency,
                    "value": f"{amount:.2f}",
                },
                "description": "CharityAI Global Donation",
            }],
            "application_context": {
                "return_url": return_url or "https://charityai.org/donate/success",
                "cancel_url": cancel_url or "https://charityai.org/donate/cancel",
                "brand_name": "CharityAI",
            },
        }

        async with httpx.AsyncClient() as client:
            res = await client.post(
                f"{self.base_url}/v2/checkout/orders",
                json=payload,
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            )
            res.raise_for_status()
            return res.json()

    async def capture_order(self, order_id: str) -> dict[str, Any]:
        """Capture payment for an authorized PayPal order."""
        token = await self._get_access_token()
        async with httpx.AsyncClient() as client:
            res = await client.post(
                f"{self.base_url}/v2/checkout/orders/{order_id}/capture",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            )
            res.raise_for_status()
            return res.json()


paypal_service = PayPalPaymentService()
