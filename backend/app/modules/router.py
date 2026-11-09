from fastapi import APIRouter

from app.modules.auth.router import router as auth_router
from app.modules.bookings.router import router as bookings_router
from app.modules.events.router import router as events_router
from app.modules.favorites.router import router as favorites_router
from app.modules.health.router import router as health_router
from app.modules.locations.router import router as locations_router
from app.modules.notifications.router import router as notifications_router
from app.modules.users.router import router as users_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(events_router)
api_router.include_router(bookings_router)
api_router.include_router(favorites_router)
api_router.include_router(locations_router)
api_router.include_router(notifications_router)
