import uuid
from datetime import UTC, datetime

from app.core.exceptions import NotFoundException
from app.modules.events.models import Event, EventStatus
from app.modules.events.repository import EventRepository
from app.modules.events.schemas import (
    EventCreate,
    EventListItem,
    EventOrganizerSummary,
    EventPage,
    EventRead,
)
from app.modules.users.models import User


class EventService:
    def __init__(self, event_repo: EventRepository) -> None:
        self.event_repo = event_repo

    async def create(self, organizer: User, data: EventCreate) -> Event:
        values = data.model_dump()
        if values.get("photo_url") is not None:
            values["photo_url"] = str(values["photo_url"])

        return await self.event_repo.create(
            **values,
            organizer_id=organizer.id,
            status=EventStatus.ON_MODERATION,
            rejection_reason=None,
            is_verified=False,
            current_confirmed=0,
            is_deleted=False,
        )

    async def get_catalog(
        self,
        *,
        city: str | None = None,
        lat: float | None = None,
        lon: float | None = None,
        radius_km: float | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> EventPage:
        rows, total, total_pages = await self.event_repo.find_catalog(
            city=city,
            lat=lat,
            lon=lon,
            radius_km=radius_km,
            page=page,
            limit=limit,
        )
        items = [self._to_list_item(event, distance_km) for event, distance_km in rows]
        return EventPage(
            items=items,
            total=total,
            page=page,
            total_pages=total_pages,
        )

    async def get_public_event(self, event_id: uuid.UUID) -> EventRead:
        event = await self.event_repo.get_by_id_with_organizer(event_id)
        if event is None or event.status != EventStatus.PUBLISHED:
            raise NotFoundException("Event not found")
        return self._to_read(event)

    def _format_organizer_name(self, organizer: User) -> str:
        if organizer.first_name and organizer.last_name:
            return f"{organizer.first_name} {organizer.last_name[0]}."
        if organizer.first_name:
            return organizer.first_name
        return organizer.email.split("@")[0]

    def _to_list_item(self, event: Event, distance_km: float | None) -> EventListItem:
        now = datetime.now(UTC)
        is_promoted = bool(
            event.promoted_to_datetime and event.promoted_to_datetime > now
        )
        available_seats = max(0, event.max_players - event.current_confirmed)
        organizer_summary = EventOrganizerSummary(
            id=event.organizer.id,
            name=self._format_organizer_name(event.organizer),
            rating_as_organizer=event.organizer.rating_as_organizer,
        )
        return EventListItem(
            id=event.id,
            title=event.title,
            game_title=event.game_title,
            city=event.city,
            address=event.address,
            start_datetime=event.start_datetime,
            entry_cost=event.entry_cost,
            max_players=event.max_players,
            current_confirmed=event.current_confirmed,
            available_seats=available_seats,
            distance_km=distance_km,
            is_promoted=is_promoted,
            organizer=organizer_summary,
        )

    def _to_read(self, event: Event) -> EventRead:
        now = datetime.now(UTC)
        is_promoted = bool(
            event.promoted_to_datetime and event.promoted_to_datetime > now
        )
        available_seats = max(0, event.max_players - event.current_confirmed)
        organizer_summary = EventOrganizerSummary(
            id=event.organizer.id,
            name=self._format_organizer_name(event.organizer),
            rating_as_organizer=event.organizer.rating_as_organizer,
        )
        return EventRead(
            id=event.id,
            organizer_id=event.organizer_id,
            title=event.title,
            description=event.description,
            game_title=event.game_title,
            address=event.address,
            city=event.city,
            lat=event.lat,
            lon=event.lon,
            start_datetime=event.start_datetime,
            end_datetime=event.end_datetime,
            min_players=event.min_players,
            max_players=event.max_players,
            current_confirmed=event.current_confirmed,
            available_seats=available_seats,
            entry_cost=event.entry_cost,
            photo_url=event.photo_url,
            status=event.status,
            is_verified=event.is_verified,
            is_promoted=is_promoted,
            organizer=organizer_summary,
            created_at=event.created_at,
            updated_at=event.updated_at,
        )
