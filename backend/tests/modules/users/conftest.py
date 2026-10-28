import uuid

import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.modules.users.enums import UserStatus
from app.modules.users.models import User
from app.modules.users.repository import UserRepository


@pytest_asyncio.fixture
async def create_mock_user(db_session: AsyncSession):
    async def _create(
        *,
        email: str | None = None,
        first_name: str = "Test",
        last_name: str = "User",
        is_superuser: bool = False,
        status: UserStatus = UserStatus.ACTIVE,
        city: str | None = None,
        contact_info: str | None = None,
    ) -> tuple[User, str]:
        repo = UserRepository(db_session)
        user_email = email or f"mock_{uuid.uuid7().hex}@example.com"
        user = await repo.create(
            email=user_email,
            hashed_password="some_hashed_password",
            first_name=first_name,
            last_name=last_name,
            is_superuser=is_superuser,
            status=status,
            city=city,
            contact_info=contact_info,
        )
        await db_session.commit()
        await db_session.refresh(user)
        token = create_access_token(str(user.id))
        return user, token

    return _create
