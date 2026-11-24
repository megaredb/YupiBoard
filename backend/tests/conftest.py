import uuid
from collections.abc import AsyncGenerator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, get_password_hash
from app.main import app
from app.modules.users.enums import UserStatus
from app.modules.users.models import User
from app.modules.users.repository import UserRepository

# Use NullPool for tests so every test gets fresh connection without event loop affinity issues
test_engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool)
TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def override_get_db() -> AsyncGenerator[AsyncSession]:
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(loop_scope="function")
async def db_session() -> AsyncGenerator[AsyncSession]:
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@pytest_asyncio.fixture(loop_scope="function")
async def async_client() -> AsyncGenerator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport, base_url="https://api.yupiboard.localhost"
    ) as client:
        yield client


@pytest_asyncio.fixture
async def create_mock_user(db_session: AsyncSession):
    async def _create(
        *,
        email: str | None = None,
        password: str | None = "password123",
        hashed_password: str | None = None,
        first_name: str = "Test",
        last_name: str = "User",
        is_verified: bool = True,
        is_superuser: bool = False,
        status: UserStatus = UserStatus.ACTIVE,
        city: str | None = None,
        contact_info: str | None = None,
        avatar_url: str | None = None,
        banner_url: str | None = None,
        bio: str | None = None,
    ) -> tuple[User, str]:
        repo = UserRepository(db_session)
        user_email = email or f"mock_{uuid.uuid7().hex}@example.com"
        final_hash: str | None = hashed_password
        if final_hash is None and password is not None:
            final_hash = get_password_hash(password)

        user = await repo.create(
            email=user_email,
            hashed_password=final_hash,
            first_name=first_name,
            last_name=last_name,
            is_verified=is_verified,
            is_superuser=is_superuser,
            status=status,
            city=city,
            contact_info=contact_info,
            avatar_url=avatar_url,
            banner_url=banner_url,
            bio=bio,
        )
        await db_session.commit()
        await db_session.refresh(user)
        token = create_access_token(str(user.id))
        return user, token

    return _create
