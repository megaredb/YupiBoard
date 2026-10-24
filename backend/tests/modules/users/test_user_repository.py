import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.repository import UserRepository


@pytest.mark.asyncio
async def test_user_repository_crud(db_session: AsyncSession) -> None:
    repo = UserRepository(db_session)
    unique_email = f"repo_user_{uuid.uuid4().hex[:8]}@example.com"
    google_sub = f"g_sub_{uuid.uuid4().hex[:8]}"

    # Create
    user = await repo.create(
        email=unique_email,
        hashed_password="some_hashed_password",
        full_name="Repo Test User",
        google_sub=google_sub,
        is_active=True,
        is_verified=False,
    )
    assert user.id is not None
    assert user.email == unique_email
    assert user.google_sub == google_sub

    # Get by ID
    fetched_by_id = await repo.get_by_id(user.id)
    assert fetched_by_id is not None
    assert fetched_by_id.email == unique_email

    # Get by email
    fetched_by_email = await repo.get_by_email(unique_email)
    assert fetched_by_email is not None
    assert fetched_by_email.id == user.id

    # Get by google_sub
    fetched_by_sub = await repo.get_by_google_sub(google_sub)
    assert fetched_by_sub is not None
    assert fetched_by_sub.id == user.id

    # Update
    updated = await repo.update(user, full_name="Updated Name", is_verified=True)
    assert updated.full_name == "Updated Name"
    assert updated.is_verified is True

    # Get all
    all_users = await repo.get_all(skip=0, limit=10)
    assert len(all_users) >= 1

    # Delete
    await repo.delete(user)
    assert await repo.get_by_id(user.id) is None
