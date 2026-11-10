import uuid
from datetime import UTC, datetime
from typing import Literal

from app.core.exceptions import (
    BadRequestException,
    ForbiddenException,
    NotFoundException,
)
from app.modules.bookings.models import BookingStatus
from app.modules.events.models import Event, EventStatus
from app.modules.events.repository import EventRepository
from app.modules.events.schemas import (
    EventCreate,
    EventFilterParams,
    EventListItem,
    EventOrganizerSummary,
    EventPage,
    EventRead,
    EventUpdate,
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
            status=EventStatus.PUBLISHED,
            rejection_reason=None,
            is_verified=False,
            current_confirmed=0,
            is_deleted=False,
        )

    async def get_catalog(
        self,
        filters: EventFilterParams,
        current_user_id: uuid.UUID | None = None,
    ) -> EventPage:
        rows, total, total_pages = await self.event_repo.find_catalog(
            filters, current_user_id=current_user_id
        )
        items = [
            self._to_list_item(
                event,
                distance_km,
                is_favorite=is_favorite,
                user_booking_status=user_booking_status,
            )
            for event, distance_km, is_favorite, user_booking_status in rows
        ]
        return EventPage(
            items=items,
            total=total,
            page=filters.page,
            total_pages=total_pages,
        )

    async def get_public_event(
        self, event_id: uuid.UUID, current_user: User | None = None
    ) -> EventRead:
        event = await self.event_repo.get_by_id_with_organizer(event_id)
        if event is None or event.is_deleted:
            raise NotFoundException("Event not found")
        if event.status != EventStatus.PUBLISHED and (
            current_user is None
            or (current_user.id != event.organizer_id and not current_user.is_superuser)
        ):
            raise NotFoundException("Event not found")
        is_favorite = False
        user_booking_status = None
        if current_user is not None:
            is_favorite = await self.event_repo.is_event_favorite(
                event.id, current_user.id
            )
            user_booking_status = await self.event_repo.get_user_booking_status(
                event.id, current_user.id
            )
        return self._to_read(
            event,
            is_favorite=is_favorite,
            user_booking_status=user_booking_status,
        )

    async def update_event(
        self,
        event_id: uuid.UUID,
        user: User,
        data: EventUpdate,
    ) -> EventRead:
        event = await self.event_repo.get_by_id_with_organizer(event_id)
        if event is None or event.is_deleted:
            raise NotFoundException("Event not found")
        if event.organizer_id != user.id and not user.is_superuser:
            raise ForbiddenException("Only the event organizer can edit this event")
        if event.start_datetime <= datetime.now(UTC):
            raise BadRequestException("Cannot edit event that has already started")

        updates = data.model_dump(exclude_unset=True)
        if "start_datetime" in updates and updates["start_datetime"] <= datetime.now(
            UTC
        ):
            raise BadRequestException("start_datetime must be in the future")

        min_players = updates.get("min_players", event.min_players)
        max_players = updates.get("max_players", event.max_players)
        if min_players > max_players:
            raise BadRequestException("min_players cannot exceed max_players")
        if max_players < event.current_confirmed:
            raise BadRequestException(
                "max_players cannot be less than confirmed players"
            )

        start_dt = updates.get("start_datetime", event.start_datetime)
        end_dt = updates.get("end_datetime", event.end_datetime)
        if end_dt and end_dt <= start_dt:
            raise BadRequestException("end_datetime must be later than start_datetime")

        updates.pop("status", None)
        updates.pop("is_verified", None)
        updates.pop("organizer_id", None)
        updates.pop("current_confirmed", None)

        if updates.get("photo_url") is not None:
            updates["photo_url"] = str(updates["photo_url"])

        updated_event = await self.event_repo.update(event, **updates)
        reloaded = await self.event_repo.get_by_id_with_organizer(updated_event.id)
        target_event = reloaded or updated_event
        is_favorite = await self.event_repo.is_event_favorite(target_event.id, user.id)
        return self._to_read(target_event, is_favorite=is_favorite)

    async def get_organizer_events(
        self,
        organizer_id: uuid.UUID,
        *,
        current_user_id: uuid.UUID | None = None,
        status: EventStatus | None = None,
        page: int = 1,
        limit: int = 20,
        sort_by: Literal["date", "name"] = "date",
        sort_order: Literal["asc", "desc"] = "desc",
    ) -> EventPage:
        rows, total, total_pages = await self.event_repo.find_by_organizer(
            organizer_id,
            current_user_id=current_user_id,
            status=status,
            page=page,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order,
        )
        return EventPage(
            items=[
                self._to_list_item(event, None, is_favorite=is_favorite)
                for event, is_favorite in rows
            ],
            total=total,
            page=page,
            total_pages=total_pages,
        )

    async def get_participant_events(
        self,
        user_id: uuid.UUID,
        *,
        current_user_id: uuid.UUID | None = None,
        status: EventStatus | None = None,
        page: int = 1,
        limit: int = 20,
        sort_by: Literal["date", "name"] = "date",
        sort_order: Literal["asc", "desc"] = "desc",
    ) -> EventPage:
        rows, total, total_pages = await self.event_repo.find_by_participant(
            user_id,
            current_user_id=current_user_id,
            status=status,
            page=page,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order,
        )
        return EventPage(
            items=[
                self._to_list_item(
                    event,
                    None,
                    is_favorite=is_favorite,
                    user_booking_status=user_booking_status,
                )
                for event, is_favorite, user_booking_status in rows
            ],
            total=total,
            page=page,
            total_pages=total_pages,
        )

    async def cancel(self, event_id: uuid.UUID, user: User) -> Event:
        event = await self.event_repo.get_by_id(event_id)
        if event is None or event.is_deleted:
            raise NotFoundException("Event not found")
        if event.organizer_id != user.id and not user.is_superuser:
            raise ForbiddenException("Only the event organizer can cancel this event")
        if event.start_datetime <= datetime.now(UTC):
            raise BadRequestException(
                "Event cancellation is closed after the start time"
            )
        return await self.event_repo.cancel_event(event)

    def _format_organizer_name(self, organizer: User) -> str:
        if organizer.first_name and organizer.last_name:
            return f"{organizer.first_name} {organizer.last_name[0]}."
        if organizer.first_name:
            return organizer.first_name
        return organizer.email.split("@")[0]

    def _to_list_item(
        self,
        event: Event,
        distance_km: float | None = None,
        is_favorite: bool = False,
        user_booking_status: BookingStatus | None = None,
    ) -> EventListItem:
        now = datetime.now(UTC)
        is_promoted = bool(
            event.promoted_to_datetime and event.promoted_to_datetime > now
        )
        available_seats = max(0, event.max_players - event.current_confirmed)
        organizer_summary = EventOrganizerSummary(
            id=event.organizer.id,
            name=self._format_organizer_name(event.organizer),
            avatar_url=event.organizer.avatar_url,
            rating_as_organizer=event.organizer.rating_as_organizer,
        )
        return EventListItem(
            id=event.id,
            title=event.title,
            game_title=event.game_title,
            location_name=event.location_name,
            city=event.city,
            address=event.address,
            start_datetime=event.start_datetime,
            entry_cost=event.entry_cost,
            max_players=event.max_players,
            current_confirmed=event.current_confirmed,
            available_seats=available_seats,
            photo_url=event.photo_url,
            distance_km=distance_km,
            is_promoted=is_promoted,
            is_favorite=is_favorite,
            user_booking_status=user_booking_status,
            status=event.status,
            organizer=organizer_summary,
        )

    def _to_read(
        self,
        event: Event,
        is_favorite: bool = False,
        user_booking_status: BookingStatus | None = None,
    ) -> EventRead:
        now = datetime.now(UTC)
        is_promoted = bool(
            event.promoted_to_datetime and event.promoted_to_datetime > now
        )
        available_seats = max(0, event.max_players - event.current_confirmed)
        organizer_summary = EventOrganizerSummary(
            id=event.organizer.id,
            name=self._format_organizer_name(event.organizer),
            avatar_url=event.organizer.avatar_url,
            rating_as_organizer=event.organizer.rating_as_organizer,
        )
        return EventRead(
            id=event.id,
            organizer_id=event.organizer_id,
            title=event.title,
            description=event.description,
            game_title=event.game_title,
            location_name=event.location_name,
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
            is_favorite=is_favorite,
            user_booking_status=user_booking_status,
            organizer=organizer_summary,
            created_at=event.created_at,
            updated_at=event.updated_at,
        )
