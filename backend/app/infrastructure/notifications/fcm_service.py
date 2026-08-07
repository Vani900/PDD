"""CharityAI – Firebase Cloud Messaging Push Notifications"""
from __future__ import annotations
from typing import Optional
from app.core.config import settings


async def send_push_notification(token: str, title: str, body: str, data: Optional[dict] = None, image_url: Optional[str] = None) -> bool:
    """Send FCM push notification to a single device token."""
    try:
        import firebase_admin
        from firebase_admin import credentials, messaging
        import os

        if not firebase_admin._apps:
            if os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
                cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
                firebase_admin.initialize_app(cred)
            else:
                return False

        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body, image=image_url),
            data={str(k): str(v) for k, v in (data or {}).items()},
            token=token,
            android=messaging.AndroidConfig(priority="high", notification=messaging.AndroidNotification(sound="default", click_action="FLUTTER_NOTIFICATION_CLICK")),
            apns=messaging.APNSConfig(payload=messaging.APNSPayload(aps=messaging.Aps(sound="default", badge=1))),
        )
        import asyncio
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, lambda: messaging.send(message))
        return True
    except Exception as e:
        import structlog
        structlog.get_logger().error("FCM push failed", error=str(e))
        return False


async def send_push_to_multiple(tokens: list[str], title: str, body: str, data: Optional[dict] = None) -> dict:
    """Send FCM notification to multiple device tokens."""
    try:
        import firebase_admin
        from firebase_admin import messaging

        if not firebase_admin._apps:
            return {"success_count": 0, "failure_count": len(tokens)}

        message = messaging.MulticastMessage(
            notification=messaging.Notification(title=title, body=body),
            data={str(k): str(v) for k, v in (data or {}).items()},
            tokens=tokens,
        )
        import asyncio
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, lambda: messaging.send_each_for_multicast(message))
        return {"success_count": response.success_count, "failure_count": response.failure_count}
    except Exception as e:
        return {"success_count": 0, "failure_count": len(tokens), "error": str(e)}
