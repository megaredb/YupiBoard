import uuid
from collections.abc import Sequence
from math import ceil

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories import BaseRepository
from app.modules.moderation.models import AdminAuditLog


class AuditLogRepository(BaseRepository[AdminAuditLog]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(AdminAuditLog, session)

    async def create_log(
        self,
        *,
        admin_id: uuid.UUID | None,
        action_type: str,
        target_entity: str,
        target_id: uuid.UUID,
        justification_reason: str | None = None,
    ) -> AdminAuditLog:
        return await self.create(
            admin_id=admin_id,
            action_type=action_type,
            target_entity=target_entity,
            target_id=target_id,
            justification_reason=justification_reason,
        )

    async def list_logs(
        self,
        *,
        page: int = 1,
        limit: int = 20,
        target_entity: str | None = None,
        action_type: str | None = None,
    ) -> tuple[Sequence[AdminAuditLog], int, int]:
        filters = []
        if target_entity:
            filters.append(AdminAuditLog.target_entity == target_entity)
        if action_type:
            filters.append(AdminAuditLog.action_type == action_type)

        total = int(
            await self.session.scalar(
                select(func.count()).select_from(AdminAuditLog).where(*filters)
            )
            or 0
        )
        result = await self.session.execute(
            select(AdminAuditLog)
            .where(*filters)
            .order_by(AdminAuditLog.executed_at.desc(), AdminAuditLog.id.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
        total_pages = ceil(total / limit) if total else 1
        return result.scalars().all(), total, total_pages
