"""
CharityAI – Email Notification Service
Supports SendGrid and SMTP with Jinja2 templating.
"""
from __future__ import annotations

import asyncio
from typing import Any

from app.core.config import settings


async def send_email(
    to: str,
    subject: str,
    template: str,
    context: dict[str, Any] | None = None,
    from_email: str | None = None,
    from_name: str | None = None,
) -> bool:
    """
    Send an email using the configured provider (SendGrid or SMTP).
    Falls back gracefully if provider is not configured.
    """
    from_email = from_email or settings.EMAIL_FROM
    from_name = from_name or settings.EMAIL_FROM_NAME
    html_body = _render_template(template, context or {})

    if settings.EMAIL_PROVIDER.value == "sendgrid" and settings.SENDGRID_API_KEY:
        return await _send_via_sendgrid(to, subject, html_body, from_email, from_name)
    elif settings.SMTP_HOST and settings.SMTP_USER:
        return await _send_via_smtp(to, subject, html_body, from_email, from_name)
    else:
        import structlog
        logger = structlog.get_logger()
        logger.warning("Email provider not configured. Email not sent.", to=to, subject=subject)
        return False


async def _send_via_sendgrid(to: str, subject: str, html_body: str, from_email: str, from_name: str) -> bool:
    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail, Email, To, Content

        sg = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
        mail = Mail(
            from_email=Email(from_email, from_name),
            to_emails=To(to),
            subject=subject,
            html_content=Content("text/html", html_body),
        )
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, lambda: sg.send(mail))
        return response.status_code in (200, 201, 202)
    except Exception as e:
        import structlog
        structlog.get_logger().error("SendGrid send failed", error=str(e))
        return False


async def _send_via_smtp(to: str, subject: str, html_body: str, from_email: str, from_name: str) -> bool:
    try:
        import aiosmtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = to
        msg.attach(MIMEText(html_body, "html"))

        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=settings.SMTP_TLS,
        )
        return True
    except Exception as e:
        import structlog
        structlog.get_logger().error("SMTP send failed", error=str(e))
        return False


def _render_template(template_name: str, context: dict[str, Any]) -> str:
    """Render a Jinja2 email template."""
    try:
        from jinja2 import Environment, PackageLoader, select_autoescape

        env = Environment(
            loader=PackageLoader("app", "infrastructure/notifications/templates"),
            autoescape=select_autoescape(["html"]),
        )
        tmpl = env.get_template(f"{template_name}.html")
        return tmpl.render(**context)
    except Exception:
        # Fallback: plain text
        app_name = context.get("app_name", "CharityAI")
        otp = context.get("otp", "")
        return f"""
        <html><body>
        <h2>{app_name}</h2>
        <p>{context.get('message', f'Your OTP is: {otp}')}</p>
        </body></html>
        """
