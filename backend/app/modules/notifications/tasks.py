from app.core.database import async_session_maker
from app.core.taskiq import broker
from app.modules.notifications.repository import NotificationRepository
from app.modules.notifications.service import NotificationService


@broker.task(schedule=[{"cron": "0 3 * * *"}])
async def purge_expired_notifications() -> int:
    async with async_session_maker() as session, session.begin():
        return await NotificationService(NotificationRepository(session)).purge_expired()
