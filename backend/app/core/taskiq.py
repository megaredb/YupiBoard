from taskiq import TaskiqEvents, TaskiqScheduler, TaskiqState
from taskiq.schedule_sources import LabelScheduleSource
from taskiq_redis import ListQueueBroker

from app.core.config import settings
from app.core.database import async_engine

REDIS_CONNECT_TIMEOUT = 5

broker = ListQueueBroker(
    settings.REDIS_URL,
    socket_timeout=None,
    socket_connect_timeout=REDIS_CONNECT_TIMEOUT,
    socket_keepalive=True,
    health_check_interval=30,
)
scheduler = TaskiqScheduler(broker, sources=[LabelScheduleSource(broker)])


@broker.on_event(TaskiqEvents.WORKER_SHUTDOWN)
async def _dispose_engine(_: TaskiqState) -> None:
    await async_engine.dispose()
