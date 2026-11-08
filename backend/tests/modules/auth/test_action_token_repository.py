import uuid
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.repository import ActionTokenRepository
from app.modules.users.repository import UserRepository


@pytest.mark.asyncio
async def test_action_token_repository_lifecycle(db_session: AsyncSession) -> None:
    user_repo = UserRepository(db_session)
    action_token_repo = ActionTokenRepository(db_session)

    # Create test user
    user = await user_repo.create(
        email=f"action_token_test_{uuid.uuid4().hex[:8]}@example.com",
        first_name="Action",
        last_name="Token",
    )
    await db_session.commit()

    jti_1 = uuid.uuid4().hex
    expires_at = datetime.now(UTC) + timedelta(hours=2)

    # 1. Create action token
    token_1 = await action_token_repo.create(
        jti=jti_1,
        user_id=user.id,
        token_type="reset_password",
        is_used=False,
        expires_at=expires_at,
    )
    await db_session.commit()
    assert token_1.id is not None
    assert token_1.is_used is False

    # 2. Get by JTI
    retrieved = await action_token_repo.get_by_jti(jti_1)
    assert retrieved is not None
    assert retrieved.id == token_1.id
    assert retrieved.user_id == user.id

    # 3. Mark as used
    await action_token_repo.mark_used(retrieved)
    await db_session.commit()
    await db_session.refresh(retrieved)
    assert retrieved.is_used is True

    # 4. Invalidate all for user
    jti_2 = uuid.uuid4().hex
    jti_3 = uuid.uuid4().hex
    await action_token_repo.create(
        jti=jti_2,
        user_id=user.id,
        token_type="reset_password",
        is_used=False,
        expires_at=expires_at,
    )
    await action_token_repo.create(
        jti=jti_3,
        user_id=user.id,
        token_type="other_type",
        is_used=False,
        expires_at=expires_at,
    )
    await db_session.commit()

    await action_token_repo.invalidate_all_for_user(
        user.id, token_type="reset_password"
    )
    await db_session.commit()

    tok_2 = await action_token_repo.get_by_jti(jti_2)
    assert tok_2 is not None
    assert tok_2.is_used is True

    tok_3 = await action_token_repo.get_by_jti(jti_3)
    assert tok_3 is not None
    assert tok_3.is_used is False  # other_type should not be affected

    # 5. Delete expired and used
    expired_jti = uuid.uuid4().hex
    await action_token_repo.create(
        jti=expired_jti,
        user_id=user.id,
        token_type="reset_password",
        is_used=False,
        expires_at=datetime.now(UTC) - timedelta(days=1),
    )
    await db_session.commit()

    deleted_count = await action_token_repo.delete_expired_and_used()
    await db_session.commit()
    assert deleted_count >= 2  # token_1, tok_2, and expired_jti were eligible
