import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    ConflictException,
    NotFoundException,
    UnauthorizedException,
)
from app.repositories.token import RefreshTokenRepository
from app.repositories.user import UserRepository
from app.schemas.auth import LoginRequest
from app.schemas.user import UserCreate, UserUpdate
from app.services.auth import AuthService
from app.services.mail import MailService
from app.services.user import UserService


def _service(session: AsyncSession) -> UserService:
    return UserService(UserRepository(session), RefreshTokenRepository(session))


def _email() -> str:
    return f"crud_{uuid.uuid4().hex[:8]}@example.com"


@pytest.mark.asyncio
async def test_create_get_and_conflict(db_session: AsyncSession) -> None:
    service = _service(db_session)
    email = _email()

    user = await service.create(
        UserCreate(email=email.upper(), password="password123", full_name="Crud")
    )
    assert user.email == email
    assert user.hashed_password and user.hashed_password != "password123"
    assert user.is_verified is False and user.is_superuser is False

    assert (await service.get_by_id(user.id)).id == user.id
    assert (await service.get_by_email(email.upper())).id == user.id

    with pytest.raises(ConflictException):
        await service.create(UserCreate(email=email, password="password123"))
    with pytest.raises(NotFoundException):
        await service.get_by_id(uuid.uuid4())


@pytest.mark.asyncio
async def test_update_profile_sets_and_clears_fields(db_session: AsyncSession) -> None:
    service = _service(db_session)
    user = await service.create(UserCreate(email=_email(), password="password123"))

    user = await service.update_profile(
        user, UserUpdate(city="Kyiv", contact_info="@yupi")
    )
    old_hash = user.hashed_password
    assert user.city == "Kyiv"
    assert user.contact_info == "@yupi"

    # unset fields stay untouched, explicit null clears
    user = await service.update_profile(user, UserUpdate(city=None))
    assert user.city is None
    assert user.contact_info == "@yupi"
    assert user.hashed_password == old_hash


@pytest.mark.asyncio
async def test_soft_delete_hides_user_and_revokes_tokens(
    db_session: AsyncSession,
) -> None:
    user_repo = UserRepository(db_session)
    token_repo = RefreshTokenRepository(db_session)
    service = UserService(user_repo, token_repo)
    user = await service.create(UserCreate(email=_email(), password="password123"))
    auth = AuthService(user_repo, token_repo, MailService())
    _, _, refresh = await auth.authenticate(
        LoginRequest(email=user.email, password="password123")
    )

    await service.delete(user)

    assert user.is_deleted is True and user.is_active is False
    assert await user_repo.get_by_id(user.id) is None
    assert await user_repo.get_by_email(user.email) is None
    assert (await user_repo.get_by_id(user.id, include_deleted=True)) is not None
    assert user.id not in {u.id for u in await service.list_users(limit=1000)}
    with pytest.raises(NotFoundException):
        await service.get_by_id(user.id)

    # the email stays reserved, and the old session is dead
    with pytest.raises(ConflictException):
        await service.create(UserCreate(email=user.email, password="password123"))
    with pytest.raises(UnauthorizedException):
        await auth.refresh_tokens(refresh)


@pytest.mark.asyncio
async def test_list_users_pagination(db_session: AsyncSession) -> None:
    service = _service(db_session)
    for _ in range(3):
        await service.create(UserCreate(email=_email(), password="password123"))

    page1 = await service.list_users(skip=0, limit=2)
    page2 = await service.list_users(skip=2, limit=2)
    assert len(page1) == 2
    assert {u.id for u in page1}.isdisjoint({u.id for u in page2})
