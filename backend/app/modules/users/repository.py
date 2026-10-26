import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories import BaseRepository
from app.modules.users.models import User


class UserRepository(BaseRepository[User]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(User, session)

    async def get_by_id(
        self, id: uuid.UUID, *, include_deleted: bool = False
    ) -> User | None:
        user = await self.session.get(User, id)
        if user is None or (user.is_deleted and not include_deleted):
            return None
        return user

    async def get_by_email(self, email: str) -> User | None:
        query = select(User).where(User.email == email.strip().lower())
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_google_sub(self, google_sub: str) -> User | None:
        query = select(User).where(User.google_sub == google_sub)
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
        """Keep the row for history, but erase personal data and free the
        email/google_sub so the person can register again."""
        user.is_deleted = True
        user.is_active = False
        user.email = f"deleted-{user.id}@deleted.yupiboard.com"
        user.google_sub = None
        user.hashed_password = None
        user.full_name = None
        user.avatar_url = None
        user.city = None
        user.contact_info = None
        self.session.add(user)
        await self.session.flush()
        await self.session.refresh(user)
        return user
