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


@pytest.mark.asyncio
async def test_soft_delete_anonymizes_and_hides_user(db_session: AsyncSession) -> None:
    repo = UserRepository(db_session)
    email = f"soft_del_{uuid.uuid4().hex[:8]}@example.com"
    google_sub = f"g_sub_{uuid.uuid4().hex[:8]}"
    user = await repo.create(
        email=email,
        hashed_password="hash",
        full_name="Soft Delete",
        google_sub=google_sub,
        avatar_url="https://example.com/a.png",
        city="Kyiv",
        contact_info="@soft",
    )

    deleted = await repo.soft_delete(user)

    assert deleted.is_deleted is True
    assert deleted.is_active is False
    assert deleted.email == f"deleted-{user.id}@deleted.yupiboard.com"
    assert deleted.google_sub is None
    assert deleted.hashed_password is None
    assert deleted.full_name is None
    assert deleted.avatar_url is None
    assert deleted.city is None
    assert deleted.contact_info is None

    # hidden from regular reads, still reachable explicitly
    assert await repo.get_by_id(user.id) is None
    assert await repo.get_by_id(user.id, include_deleted=True) is not None
    assert user.id not in {u.id for u in await repo.get_all(limit=1000)}
    assert user.id in {
        u.id for u in await repo.get_all(limit=1000, include_deleted=True)
    }

    # email and google_sub are free again
    assert await repo.get_by_email(email) is None
    assert await repo.get_by_google_sub(google_sub) is None
