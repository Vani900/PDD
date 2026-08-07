"""
CharityAI – Base Model Mixin
Provides common fields for all database models: UUID PK, timestamps, soft delete.
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column


class UUIDMixin:
    """UUID primary key mixin."""

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )


class TimestampMixin:
    """Created/updated timestamp mixin using server-side defaults."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class SoftDeleteMixin:
    """Soft delete mixin – records are never physically removed."""

    is_deleted: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, index=True
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    deleted_by: Mapped[str | None] = mapped_column(String(36), nullable=True)


class AuditMixin:
    """Who created and last modified this record."""

    created_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    updated_by: Mapped[str | None] = mapped_column(String(36), nullable=True)


class BaseModel(UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin):
    """
    Full base model combining all mixins.
    Inherit from this for most domain entities.
    """

    __abstract__ = True

    def to_dict(self) -> dict[str, Any]:
        """Serialize model to dict, excluding internal SA state."""
        table = getattr(self, "__table__", None)
        if table is None:
            return {}
        return {
            col.name: getattr(self, col.name)
            for col in table.columns
        }
