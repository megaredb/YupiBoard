import logging
import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Literal

from app.core.exceptions import (
    BadRequestException,
    ForbiddenException,
    NotFoundException,
)
from app.core.media_url import normalize_stored_media_url
from app.core.realtime import RealtimeBroker, realtime_broker
from app.modules.bookings.models import BookingStatus
from app.modules.events.models import (
    DEFAULT_EVENT_DURATION,
    AutoCheckStatus,
    Event,
    EventStatus,
)
from app.modules.events.repository import CompletedEventRow, EventRepository
from app.modules.events.schemas import (
    EventCreate,
    EventFilterParams,
    EventListItem,
    EventOrganizerSummary,
    EventPage,
    EventRead,
    EventUpdate,
)
from app.modules.moderation.auto_check import run_event_auto_moderation
from app.modules.moderation.models import AuditActionType
from app.modules.notifications.enums import NotificationType
from app.modules.notifications.schemas import NotificationCreate
from app.modules.notifications.service import NotificationService
from app.modules.users.models import User

if TYPE_CHECKING:
    from app.modules.locations.geocoding import GeocodingService
    from app.modules.locations.repository import CityRepository
    from app.modules.moderation.repository import AuditLogRepository

logger = logging.getLogger("yupiboard.events")


class EventService:
    def __init__(
        self,
        event_repo: EventRepository,
        notification_service: NotificationService | None = None,
        *,
        geocoding_service: GeocodingService | None = None,
        city_repo: CityRepository | None = None,
        audit_repo: AuditLogRepository | None = None,
        realtime: RealtimeBroker | None = None,
    ) -> None:
        self.event_repo = event_repo
        self.notification_service = notification_service
        self.geocoding_service = geocoding_service
        self.city_repo = city_repo
        self.audit_repo = audit_repo
        self.realtime = realtime if realtime is not None else realtime_broker

    async def _resolve_coordinates(
        self,
        *,
        address: str,
        city: str,
        lat: float | None,
        lon: float | None,
    ) -> tuple[float, float, bool]:
        """Return (lat, lon, needs_async_geocode)."""
        if lat is not None and lon is not None:
            return lat, lon, False

        center = await self.city_repo.get_center(city) if self.city_repo else None
        if self.geocoding_service is not None:
            results = await self.geocoding_service.geocode(
                address, city=city, center=center, limit=1
            )
            if results:
                return results[0].lat, results[0].lon, False

        if center is not None:
            return center[0], center[1], True

        raise BadRequestException(
            "Could not determine coordinates for the given address; "
            "please provide lat and lon"
        )

    async def _run_auto_moderation(
        self,
        *,
        organizer_id: uuid.UUID,
        title: str,
        description: str,
        game_title: str,
        start_datetime: datetime,
        city: str,
        address: str,
        exclude_event_id: uuid.UUID | None = None,
    ) -> tuple[AutoCheckStatus, str | None]:
        try:
            has_duplicate = (
                await self.event_repo.has_duplicate_event(
                    organizer_id=organizer_id,
                    start_datetime=start_datetime,
                    city=city,
                    address=address,
                    exclude_event_id=exclude_event_id,
                )
            ) is True
            passed, reason = run_event_auto_moderation(
                title=title,
                description=description,
                game_title=game_title,
                has_duplicate=has_duplicate,
            )
            return (
                AutoCheckStatus.PASSED if passed else AutoCheckStatus.FAILED
            ), reason
        except Exception as exc:  # noqa: BLE001
            # Per SRS 3.2.6.5: automatic check failure sends event to manual queue.
            logger.warning("Automatic moderation check failed, falling back: %s", exc)
            return AutoCheckStatus.UNAVAILABLE, None

    async def create(self, organizer: User, data: EventCreate) -> Event:
        values = data.model_dump()
        if values.get("photo_url") is not None:
            values["photo_url"] = normalize_stored_media_url(str(values["photo_url"]))
        if values.get("end_datetime") is None:
            values["end_datetime"] = data.start_datetime + DEFAULT_EVENT_DURATION

        lat, lon, needs_async_geocode = await self._resolve_coordinates(
            address=data.address,
            city=data.city,
            lat=data.lat,
            lon=data.lon,
        )
        values["lat"] = lat
        values["lon"] = lon

        auto_check, auto_reason = await self._run_auto_moderation(
            organizer_id=organizer.id,
            title=data.title,
            description=data.description,
            game_title=data.game_title,
            start_datetime=data.start_datetime,
            city=data.city,
            address=data.address,
        )
        passed = auto_check != AutoCheckStatus.FAILED

        event = await self.event_repo.create(
            **values,
            organizer_id=organizer.id,
            auto_check_status=auto_check,
            status=(EventStatus.ON_MODERATION if passed else EventStatus.REJECTED),
            rejection_reason=None if passed else auto_reason,
            is_verified=False,
            current_confirmed=0,
            is_deleted=False,
        )

        if not passed:
            if self.audit_repo is not None:
                await self.audit_repo.create_log(
                    admin_id=None,
                    action_type=AuditActionType.EVENT_AUTO_REJECTED,
                    target_entity="Event",
                    target_id=event.id,
                    justification_reason=auto_reason,
                )
            if self.notification_service is not None:
                await self.notification_service.notify(
                    NotificationCreate(
                        user_id=organizer.id,
                        notification_type=NotificationType.EVENT_REJECTED,
                        title="Event Rejected",
                        message=f"Your event {event.title} was rejected: {auto_reason}",
                        metadata_payload={
                            "event_id": str(event.id),
                            "reason": auto_reason,
                        },
                    )
                )

        if needs_async_geocode:
            try:
                from app.modules.events.tasks import geocode_event_coordinates

                await geocode_event_coordinates.kiq(str(event.id))
            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    "Failed to enqueue background geocoding for event %s: %s",
                    event.id,
                    exc,
                )

        return event

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
        is_privileged = current_user is not None and (
            current_user.id == event.organizer_id or current_user.is_superuser
        )
        if (
            event.status in (EventStatus.ON_MODERATION, EventStatus.REJECTED)
            and not is_privileged
        ):
            raise NotFoundException("Event not found")
        is_favorite = False
        user_booking_status = None
        user_booking_rejection_reason = None
        if current_user is not None:
            is_favorite = await self.event_repo.is_event_favorite(
                event.id, current_user.id
            )
            user_booking_status = await self.event_repo.get_user_booking_status(
                event.id, current_user.id
            )
            if user_booking_status in (
                BookingStatus.REJECTED,
                BookingStatus.REMOVED_BY_ORGANIZER,
            ):
                user_booking_rejection_reason = (
                    await self.event_repo.get_user_booking_rejection_reason(
                        event.id, current_user.id
                    )
                )
        return self._to_read(
            event,
            is_favorite=is_favorite,
            user_booking_status=user_booking_status,
            user_booking_rejection_reason=user_booking_rejection_reason,
            include_rejection_reason=is_privileged,
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

        if updates.get("end_datetime") is None:
            updates.pop("end_datetime", None)
            if "start_datetime" in updates:
                # Moving the start keeps the original duration.
                duration = event.end_datetime - event.start_datetime
                updates["end_datetime"] = updates["start_datetime"] + duration

        start_dt = updates.get("start_datetime", event.start_datetime)
        end_dt = updates.get("end_datetime", event.end_datetime)
        if end_dt <= start_dt:
            raise BadRequestException("end_datetime must be later than start_datetime")

        updates.pop("status", None)
        updates.pop("is_verified", None)
        updates.pop("organizer_id", None)
        updates.pop("current_confirmed", None)

        if updates.get("photo_url") is not None:
            updates["photo_url"] = normalize_stored_media_url(str(updates["photo_url"]))

        if (
            ("address" in updates or "city" in updates)
            and "lat" not in updates
            and "lon" not in updates
            and self.geocoding_service is not None
        ):
            new_address = updates.get("address", event.address)
            new_city = updates.get("city", event.city)
            center = (
                await self.city_repo.get_center(new_city) if self.city_repo else None
            )
            results = await self.geocoding_service.geocode(
                new_address, city=new_city, center=center, limit=1
            )
            if results:
                updates["lat"] = results[0].lat
                updates["lon"] = results[0].lon

        if event.status == EventStatus.REJECTED:
            auto_check, auto_reason = await self._run_auto_moderation(
                organizer_id=event.organizer_id,
                title=updates.get("title", event.title),
                description=updates.get("description", event.description),
                game_title=updates.get("game_title", event.game_title),
                start_datetime=start_dt,
                city=updates.get("city", event.city),
                address=updates.get("address", event.address),
                exclude_event_id=event.id,
            )
            updates["auto_check_status"] = auto_check
            updates["moderated_by_id"] = None
            updates["moderated_at"] = None
            if auto_check != AutoCheckStatus.FAILED:
                updates["status"] = EventStatus.ON_MODERATION
                updates["is_verified"] = False
                updates["rejection_reason"] = None
            else:
                updates["status"] = EventStatus.REJECTED
                updates["is_verified"] = False
                updates["rejection_reason"] = auto_reason

        updated_event = await self.event_repo.update(
            event, exclude_none=False, **updates
        )
        reloaded = await self.event_repo.get_by_id_with_organizer(updated_event.id)
        target_event = reloaded or updated_event
        if (
            self.notification_service is not None
            and target_event.status == EventStatus.PUBLISHED
        ):
            recipient_ids = await self.event_repo.get_active_booking_user_ids(
                target_event.id
            )
            await self.notification_service.notify_many(
                [
                    NotificationCreate(
                        user_id=recipient_id,
                        notification_type=NotificationType.EVENT_UPDATED,
                        title="Venue Details Updated",
                        message=f"Event details updated for {target_event.title}.",
                        metadata_payload={"event_id": str(target_event.id)},
                    )
                    for recipient_id in recipient_ids
                ]
            )
        await self._publish_event_state(target_event)
        is_favorite = await self.event_repo.is_event_favorite(target_event.id, user.id)
        user_booking_status = await self.event_repo.get_user_booking_status(
            target_event.id, user.id
        )
        return self._to_read(
            target_event,
            is_favorite=is_favorite,
            user_booking_status=user_booking_status,
            include_rejection_reason=True,
        )

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
        recipient_ids: list[uuid.UUID] = []
        if self.notification_service is not None:
            recipient_ids = await self.event_repo.get_active_booking_user_ids(event.id)
        cancelled_event = await self.event_repo.cancel_event(event)
        if self.notification_service is not None and recipient_ids:
            await self.notification_service.notify_many(
                [
                    NotificationCreate(
                        user_id=recipient_id,
                        notification_type=NotificationType.EVENT_CANCELLED,
                        title="Event Cancelled",
                        message=f"The event {event.title} has been cancelled by the organizer.",
                        metadata_payload={"event_id": str(event.id)},
                    )
                    for recipient_id in recipient_ids
                ]
            )
        await self._publish_event_state(cancelled_event)
        return cancelled_event

    async def complete(self, event_id: uuid.UUID, user: User) -> EventRead:
        event = await self.event_repo.lock_event(event_id)
        if event is None:
            raise NotFoundException("Event not found")
        if event.organizer_id != user.id and not user.is_superuser:
            raise ForbiddenException("Only the event organizer can complete this event")
        now = datetime.now(UTC)
        if (
            event.status not in (EventStatus.PUBLISHED, EventStatus.ONGOING)
            or event.start_datetime > now
        ):
            raise BadRequestException("Only an ongoing event can be completed")

        # Ending early moves end_datetime, so the 48h review window starts now.
        await self.event_repo.update(
            event, status=EventStatus.COMPLETED, end_datetime=now
        )
        reloaded = await self.event_repo.get_by_id_with_organizer(event.id)
        target_event = reloaded or event
        await self._publish_event_state(target_event)
        user_booking_status = await self.event_repo.get_user_booking_status(
            target_event.id, user.id
        )
        is_favorite = await self.event_repo.is_event_favorite(target_event.id, user.id)
        return self._to_read(
            target_event,
            is_favorite=is_favorite,
            user_booking_status=user_booking_status,
            include_rejection_reason=True,
        )

    async def advance_statuses(self, now: datetime) -> tuple[int, int]:
        """Scheduled transition PUBLISHED -> ONGOING -> COMPLETED.

        Returns (started, completed) counts. Organizers and attended players of
        newly completed events are reminded to leave reviews.
        """
        started_result = await self.event_repo.start_due_events(now)
        if isinstance(started_result, int):
            started_ids: list[uuid.UUID] = []
            started_count = started_result
        else:
            started_ids = list(started_result)
            started_count = len(started_ids)

        completed = await self.event_repo.complete_due_events(now)
        if completed and self.notification_service is not None:
            await self._send_review_reminders(completed)

        for event_id in started_ids:
            await self.realtime.publish_event_update(
                event_id,
                "event.updated",
                {"event_id": str(event_id), "status": EventStatus.ONGOING.value},
            )
        for row in completed:
            await self.realtime.publish_event_update(
                row.id,
                "event.updated",
                {"event_id": str(row.id), "status": EventStatus.COMPLETED.value},
            )
        return started_count, len(completed)

    async def _send_review_reminders(self, events: list[CompletedEventRow]) -> None:
        if self.notification_service is None:
            return
        attended = await self.event_repo.get_attended_user_ids(
            [event.id for event in events]
        )
        reminders: list[NotificationCreate] = []
        for event in events:
            meta = {
                "event_id": str(event.id),
                "review_deadline": event.review_deadline.isoformat(),
            }
            reminders.append(
                NotificationCreate(
                    user_id=event.organizer_id,
                    notification_type=NotificationType.REVIEW_REMINDER,
                    title="Event Finished",
                    message=(
                        f"{event.title} has finished. Mark attendance and rate "
                        "your players within 48 hours."
                    ),
                    metadata_payload={**meta, "target_role": "Player"},
                )
            )
            reminders.extend(
                NotificationCreate(
                    user_id=player_id,
                    notification_type=NotificationType.REVIEW_REMINDER,
                    title="Rate the Organizer",
                    message=(
                        f"How was {event.title}? Rate the organizer within 48 hours."
                    ),
                    metadata_payload={**meta, "target_role": "Organizer"},
                )
                for player_id in attended.get(event.id, [])
            )
        await self.notification_service.notify_many(reminders)

    async def _publish_event_state(self, event: Event) -> None:
        await self.realtime.publish_event_update(
            event.id,
            "event.updated",
            {
                "event_id": str(event.id),
                "status": event.status.value,
                "current_confirmed": event.current_confirmed,
                "available_seats": max(0, event.max_players - event.current_confirmed),
                "is_verified": event.is_verified,
            },
        )

    def serialize_event(
        self,
        event: Event,
        *,
        include_rejection_reason: bool = True,
    ) -> EventRead:
        return self._to_read(event, include_rejection_reason=include_rejection_reason)

    def _format_organizer_name(self, organizer: User) -> str:
        if organizer.is_deleted:
            return "Deleted User"
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
            rating_as_organizer_count=event.organizer.rating_as_organizer_count or 0,
        )
        return EventListItem(
            id=event.id,
            title=event.title,
            game_title=event.game_title,
            location_name=event.location_name,
            city=event.city,
            address=event.address,
            start_datetime=event.start_datetime,
            end_datetime=event.end_datetime,
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
        user_booking_rejection_reason: str | None = None,
        *,
        include_rejection_reason: bool = False,
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
            rating_as_organizer_count=event.organizer.rating_as_organizer_count or 0,
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
            review_deadline=event.review_deadline,
            min_players=event.min_players,
            max_players=event.max_players,
            current_confirmed=event.current_confirmed,
            available_seats=available_seats,
            entry_cost=event.entry_cost,
            photo_url=event.photo_url,
            status=event.status,
            auto_check_status=event.auto_check_status,
            rejection_reason=(
                event.rejection_reason if include_rejection_reason else None
            ),
            is_verified=event.is_verified,
            is_promoted=is_promoted,
            is_favorite=is_favorite,
            user_booking_status=user_booking_status,
            user_booking_rejection_reason=user_booking_rejection_reason,
            organizer=organizer_summary,
            created_at=event.created_at,
            updated_at=event.updated_at,
        )
