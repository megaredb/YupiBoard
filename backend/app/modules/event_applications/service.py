import uuid

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    NotFoundException,
)
from app.modules.event_applications.models import ApplicationStatus, EventApplication
from app.modules.event_applications.repository import EventApplicationRepository
from app.modules.events.models import Event, EventStatus
from app.modules.events.repository import EventRepository
from app.modules.users.models import User


class EventApplicationService:
    def __init__(
        self,
        application_repo: EventApplicationRepository,
        event_repo: EventRepository,
    ) -> None:
        self.application_repo = application_repo
        self.event_repo = event_repo

    async def apply(self, event: Event, user: User) -> EventApplication:
        locked_event = await self.event_repo.lock_event(event.id)
        if locked_event is None or locked_event.status != EventStatus.PUBLISHED:
            raise NotFoundException("Event not found")
        if event.organizer_id == user.id:
            raise BadRequestException("Organizers cannot apply to their own event")
        previous = await self.application_repo.for_user(event.id, user.id)
        if previous is not None:
            raise ConflictException("You have already applied to this event")
        if await self.application_repo.active_count(event.id) >= event.max_players:
            raise ConflictException("Event has no available seats")
        # TODO: Notify the organizer when the notification module is available.
        return await self.application_repo.create(event.id, user.id)

    async def update(
        self, application: EventApplication, status: ApplicationStatus
    ) -> EventApplication:
        if status == ApplicationStatus.PENDING:
            raise BadRequestException("Application status cannot be reset to pending")
        if (
            application.status != ApplicationStatus.PENDING
            and status != ApplicationStatus.CANCELLED
        ):
            raise ConflictException("Only pending applications can be updated")
        if status == ApplicationStatus.CANCELLED and application.status not in (
            ApplicationStatus.PENDING,
            ApplicationStatus.ACCEPTED,
        ):
            raise ConflictException("Only active applications can be cancelled")
        application.status = status
        await self.application_repo.session.flush()
        await self.application_repo.session.refresh(application)
        return application

    async def get(self, application_id: uuid.UUID) -> EventApplication:
        application = await self.application_repo.get(application_id)
        if application is None:
            raise NotFoundException("Application not found")
        return application
