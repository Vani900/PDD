"""
CharityAI – Abstract Repository Interfaces
Domain-driven design repository contracts for User, NGO, Donation, Volunteer, HelpRequest.
"""
from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from typing import Generic, Sequence, TypeVar

from app.infrastructure.database.models.base import BaseModel

T = TypeVar("T", bound=BaseModel)


class IRepository(ABC, Generic[T]):
    """Generic base repository interface."""

    @abstractmethod
    async def get_by_id(self, entity_id: uuid.UUID) -> T | None:
        pass

    @abstractmethod
    async def get_all(self, skip: int = 0, limit: int = 100) -> Sequence[T]:
        pass

    @abstractmethod
    async def create(self, entity: T) -> T:
        pass

    @abstractmethod
    async def update(self, entity: T) -> T:
        pass

    @abstractmethod
    async def soft_delete(self, entity_id: uuid.UUID, deleted_by: str | None = None) -> bool:
        pass


class IUserRepository(IRepository):
    """User specific repository interface."""

    @abstractmethod
    async def get_by_email(self, email: str) -> BaseModel | None:
        pass


class IDonationRepository(IRepository):
    """Donation specific repository interface."""

    @abstractmethod
    async def get_by_donor(self, donor_id: uuid.UUID, skip: int = 0, limit: int = 20) -> Sequence[BaseModel]:
        pass

    @abstractmethod
    async def get_by_tracking_number(self, tracking_number: str) -> BaseModel | None:
        pass


class INGOMultitenantRepository(IRepository):
    """NGO repository interface."""

    @abstractmethod
    async def get_by_slug(self, slug: str) -> BaseModel | None:
        pass
