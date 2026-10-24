import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Soft-deleted users are hidden unless `include_deleted=True` is passed."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(User, session)

    async def get_by_id(
        self, id: uuid.UUID, *, include_deleted: bool = False
    ) -> User | None:
        user = await self.session.get(User, id)
        if user is None or (user.is_deleted and not include_deleted):
            return None
        return user

    async def get_by_email(
        self, email: str, *, include_deleted: bool = False
    ) -> User | None:
        query = select(User).where(User.email == email.strip().lower())
        if not include_deleted:
            query = query.where(User.is_deleted.is_(False))
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_google_sub(
        self, google_sub: str, *, include_deleted: bool = False
    ) -> User | None:
        query = select(User).where(User.google_sub == google_sub)
        if not include_deleted:
            query = query.where(User.is_deleted.is_(False))
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_all(
        self, skip: int = 0, limit: int = 100, *, include_deleted: bool = False
    ) -> Sequence[User]:
        query = select(User).order_by(User.created_at, User.id)
        if not include_deleted:
            query = query.where(User.is_deleted.is_(False))
        result = await self.session.execute(query.offset(skip).limit(limit))
        return result.scalars().all()

    async def soft_delete(self, user: User) -> User:
        user.is_deleted = True
        user.is_active = False
        self.session.add(user)
        await self.session.flush()
        await self.session.refresh(user)
        return user
