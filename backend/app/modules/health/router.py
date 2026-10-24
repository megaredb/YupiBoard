from fastapi import APIRouter, status

from app.core.database import SessionDep
from app.modules.health.schemas import HealthResponse
from app.modules.health.service import HealthService

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse, status_code=status.HTTP_200_OK)
async def health_check(session: SessionDep) -> HealthResponse:
    return await HealthService.check(session)
