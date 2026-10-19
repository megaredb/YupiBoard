import uuid
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.token import RefreshTokenRepository
from app.repositories.user import UserRepository


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
async def test_refresh_token_repository(db_session: AsyncSession) -> None:
    user_repo = UserRepository(db_session)
    token_repo = RefreshTokenRepository(db_session)

    user = await user_repo.create(
        email=f"token_user_{uuid.uuid4().hex[:8]}@example.com",
        hashed_password="pwd",
        full_name="Token User",
    )

    token_hash1 = uuid.uuid4().hex
    token_hash2 = uuid.uuid4().hex
    expires_at = datetime.now(UTC) + timedelta(days=7)

    # Create tokens
    t1 = await token_repo.create(
        token_hash=token_hash1, user_id=user.id, expires_at=expires_at
    )
    t2 = await token_repo.create(
        token_hash=token_hash2, user_id=user.id, expires_at=expires_at
    )
    assert t1.id is not None
    assert t2.id is not None
    assert t1.revoked is False

    # Get by hash
    fetched = await token_repo.get_by_hash(token_hash1)
    assert fetched is not None
    assert fetched.id == t1.id

    # Revoke single token
    await token_repo.revoke(t1)
    fetched_after_revoke = await token_repo.get_by_hash(token_hash1)
    assert fetched_after_revoke is not None
    assert fetched_after_revoke.revoked is True

    # Revoke all for user
    await token_repo.revoke_all_for_user(user.id)
    t2_after_all_revoke = await token_repo.get_by_hash(token_hash2)
    assert t2_after_all_revoke is not None
    assert t2_after_all_revoke.revoked is True

    # Delete expired and revoked
    deleted_count = await token_repo.delete_expired_and_revoked()
    assert deleted_count >= 2
