from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.health.schemas import HealthResponse


class HealthService:
    @staticmethod
    async def check(session: AsyncSession) -> HealthResponse:
        try:
            await session.execute(text("SELECT 1"))
            db_status = "connected"
        except (SQLAlchemyError, OSError) as e:
            db_status = f"unhealthy: {e!s}"

        return HealthResponse(
            status="healthy" if db_status == "connected" else "degraded",
            database=db_status,
            version="0.1.0",
        )
