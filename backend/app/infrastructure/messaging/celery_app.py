"""
CharityAI – Celery Application & Task Definitions
Background tasks: emails, notifications, AI processing, report generation, sync.
"""
from __future__ import annotations

from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

# ── Celery App ────────────────────────────────────────────────────────────────
celery_app = Celery(
    "charityai",
    broker=settings.get_celery_broker_url(),
    backend=settings.CELERY_RESULT_BACKEND or settings.get_redis_url().replace("/0", "/1"),
    include=[
        "app.infrastructure.messaging.tasks.email_tasks",
        "app.infrastructure.messaging.tasks.notification_tasks",
        "app.infrastructure.messaging.tasks.ai_tasks",
        "app.infrastructure.messaging.tasks.report_tasks",
        "app.infrastructure.messaging.tasks.sync_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_routes={
        "app.infrastructure.messaging.tasks.email_tasks.*": {"queue": "emails"},
        "app.infrastructure.messaging.tasks.notification_tasks.*": {"queue": "notifications"},
        "app.infrastructure.messaging.tasks.ai_tasks.*": {"queue": "ai_tasks"},
        "app.infrastructure.messaging.tasks.report_tasks.*": {"queue": "default"},
        "app.infrastructure.messaging.tasks.sync_tasks.*": {"queue": "default"},
    },
    beat_schedule={
        # Daily: clean up expired OTPs
        "cleanup-expired-otps": {
            "task": "app.infrastructure.messaging.tasks.sync_tasks.cleanup_expired_otps",
            "schedule": crontab(hour=2, minute=0),
        },
        # Every 6 hours: AI demand forecasting
        "ai-demand-forecast": {
            "task": "app.infrastructure.messaging.tasks.ai_tasks.run_demand_forecasting",
            "schedule": crontab(minute=0, hour="*/6"),
        },
        # Daily: generate NGO impact reports
        "daily-ngo-reports": {
            "task": "app.infrastructure.messaging.tasks.report_tasks.generate_daily_ngo_reports",
            "schedule": crontab(hour=6, minute=0),
        },
        # Every minute: process pending notifications
        "process-notifications": {
            "task": "app.infrastructure.messaging.tasks.notification_tasks.process_pending_notifications",
            "schedule": crontab(minute="*"),
        },
    },
)
