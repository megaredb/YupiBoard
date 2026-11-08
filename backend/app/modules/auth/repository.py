import uuid
from datetime import UTC, datetime

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories import BaseRepository
from app.modules.auth.models import ActionToken, RefreshToken


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(RefreshToken, session)

    async def get_by_hash(self, token_hash: str) -> RefreshToken | None:
        query = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def revoke(self, token: RefreshToken) -> None:
        token.revoked = True
        self.session.add(token)
        await self.session.flush()

    async def revoke_all_for_user(self, user_id: uuid.UUID) -> None:
        query = (
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id)
            .values(revoked=True)
        )
        await self.session.execute(query)
        await self.session.flush()

    async def delete_expired_and_revoked(self) -> int:
        now = datetime.now(UTC)
        query = delete(RefreshToken).where(
            (RefreshToken.expires_at < now) | (RefreshToken.revoked.is_(True))
        )
        result = await self.session.execute(query)
        rowcount = getattr(result, "rowcount", 0)
        return int(rowcount)


class ActionTokenRepository(BaseRepository[ActionToken]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(ActionToken, session)

    async def get_by_jti(self, jti: str) -> ActionToken | None:
        query = select(ActionToken).where(ActionToken.jti == jti)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def invalidate_all_for_user(
        self, user_id: uuid.UUID, token_type: str = "reset_password"
    ) -> None:
        query = (
            update(ActionToken)
            .where(
                ActionToken.user_id == user_id,
                ActionToken.token_type == token_type,
                ActionToken.is_used.is_(False),
            )
            .values(is_used=True)
        )
        await self.session.execute(query)
        await self.session.flush()

    async def mark_used(self, token: ActionToken) -> None:
        token.is_used = True
        self.session.add(token)
        await self.session.flush()

    async def mark_as_used(self, token: ActionToken) -> None:
        await self.mark_used(token)

    async def delete_expired_and_used(self) -> int:
        now = datetime.now(UTC)
        query = delete(ActionToken).where(
            (ActionToken.expires_at < now) | (ActionToken.is_used.is_(True))
        )
        result = await self.session.execute(query)
        rowcount = getattr(result, "rowcount", 0)
        return int(rowcount)
