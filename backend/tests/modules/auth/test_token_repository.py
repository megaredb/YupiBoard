import uuid
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.repository import RefreshTokenRepository
from app.modules.users.repository import UserRepository


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
