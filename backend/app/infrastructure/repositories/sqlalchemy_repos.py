"""
CharityAI – SQLAlchemy Async Repository Implementations
Concrete implementation of repository interfaces using SQLAlchemy 2.0 async sessions.
"""
from __future__ import annotations

import uuid
from typing import Sequence, Type, TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.infrastructure.database.models.base import BaseModel
from app.infrastructure.database.models.donations import Donation
from app.infrastructure.database.models.organizations import Organization
from app.infrastructure.database.models.users import User

T = TypeVar("T", bound=BaseModel)


class SQLAlchemyRepository:
    """Base async repository using SQLAlchemy session."""

    def __init__(self, model_class: Type[T], db: AsyncSession) -> None:
        self.model_class = model_class
        self.db = db

    async def get_by_id(self, entity_id: uuid.UUID) -> T | None:
        result = await self.db.execute(
            select(self.model_class).where(
                self.model_class.id == entity_id,  # type: ignore[attr-defined]
                self.model_class.is_deleted == False,  # type: ignore[attr-defined]
            )
        )
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> Sequence[T]:
        result = await self.db.execute(
            select(self.model_class)
            .where(self.model_class.is_deleted == False)  # type: ignore[attr-defined]
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def create(self, entity: T) -> T:
        self.db.add(entity)
        await self.db.flush()
        return entity

    async def update(self, entity: T) -> T:
        await self.db.flush()
        return entity

    async def soft_delete(self, entity_id: uuid.UUID, deleted_by: str | None = None) -> bool:
        entity = await self.get_by_id(entity_id)
        if not entity:
            return False
        from datetime import UTC, datetime
        entity.is_deleted = True  # type: ignore[attr-defined]
        entity.deleted_at = datetime.now(UTC)  # type: ignore[attr-defined]
        entity.deleted_by = deleted_by  # type: ignore[attr-defined]
        await self.db.flush()
        return True


class UserRepository(SQLAlchemyRepository):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.profile))
            .where(User.email == email.lower(), User.is_deleted == False)
        )
        return result.scalar_one_or_none()


class DonationRepository(SQLAlchemyRepository):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Donation, db)

    async def get_by_tracking_number(self, tracking_number: str) -> Donation | None:
        result = await self.db.execute(
            select(Donation)
            .options(selectinload(Donation.items))
            .where(Donation.tracking_number == tracking_number, Donation.is_deleted == False)
        )
        return result.scalar_one_or_none()


class NGORepository(SQLAlchemyRepository):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Organization, db)

    async def get_by_slug(self, slug: str) -> Organization | None:
        result = await self.db.execute(
            select(Organization)
            .options(selectinload(Organization.campaigns))
            .where(Organization.slug == slug, Organization.is_deleted == False)
        )
        return result.scalar_one_or_none()
