from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from pydantic import ValidationError
from sqlalchemy import Float

from app.main import app
from app.modules.events.models import Event, EventStatus
from app.modules.events.schemas import EventCreate, EventFilterParams


def valid_event_data() -> dict[str, object]:
    return {
        "title": "Board game night",
        "description": "A casual game night",
        "game_title": "Catan",
        "address": "Main street 1",
        "lat": 50.45,
        "lon": 30.52,
        "city": "Kyiv",
        "start_datetime": datetime.now(UTC) + timedelta(days=1),
        "min_players": 2,
        "max_players": 6,
        "entry_cost": Decimal("0.00"),
    }


def test_event_create_accepts_valid_domain_data() -> None:
    event = EventCreate.model_validate(valid_event_data())

    assert event.lon == 30.52
    assert event.max_players == 6
    assert Event.status.property.columns[0].default.arg == EventStatus.ON_MODERATION


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("lat", 91),
        ("lat", -91),
        ("lon", 181),
        ("lon", -181),
        ("min_players", 0),
        ("min_players", 21),
        ("max_players", 0),
        ("max_players", 21),
        ("entry_cost", -0.01),
        ("title", "ab"),
        ("title", "a" * 101),
    ],
)
def test_event_create_rejects_invalid_domain_data(field: str, value: object) -> None:
    data = valid_event_data()
    data[field] = value

    with pytest.raises(ValidationError):
        EventCreate.model_validate(data)


def test_event_create_checks_player_and_datetime_ranges() -> None:
    data = valid_event_data()
    data["min_players"] = 7

    with pytest.raises(ValidationError, match="min_players cannot exceed max_players"):
        EventCreate.model_validate(data)

    data = valid_event_data()
    start_dt = data["start_datetime"]
    assert isinstance(start_dt, datetime)
    data["end_datetime"] = start_dt - timedelta(minutes=1)
    with pytest.raises(ValidationError, match="end_datetime must be later"):
        EventCreate.model_validate(data)

    data = valid_event_data()
    data["start_datetime"] = datetime.now(UTC) - timedelta(minutes=5)
    with pytest.raises(ValidationError, match="start_datetime must be in the future"):
        EventCreate.model_validate(data)


@pytest.mark.parametrize("value", [1, 20])
def test_event_filters_accept_available_seats_min_in_range(value: int) -> None:
    filters = EventFilterParams.model_validate({"available_seats_min": value})

    assert filters.available_seats_min == value


@pytest.mark.parametrize("value", [0, -1, 21])
def test_event_filters_reject_available_seats_min_out_of_range(value: int) -> None:
    with pytest.raises(ValidationError):
        EventFilterParams.model_validate({"available_seats_min": value})


def test_event_model_columns() -> None:
    assert isinstance(Event.__table__.c.lat.type, Float)
    assert isinstance(Event.__table__.c.lon.type, Float)
    assert "current_confirmed" in Event.__table__.c
    assert EventStatus.ON_MODERATION == "OnModeration"
    assert EventStatus.REJECTED == "Rejected"
    assert EventStatus.PUBLISHED == "Published"
    assert EventStatus.ONGOING == "Ongoing"
    assert EventStatus.COMPLETED == "Completed"
    assert EventStatus.CANCELLED == "Cancelled"


def test_event_routes_are_registered() -> None:
    paths = app.openapi()["paths"]

    assert "/api/v1/events" in paths
    assert "/api/v1/events/{event_id}" in paths
    assert "/api/v1/events/{event_id}/applications" not in paths
    assert "/api/v1/events/{event_id}/ratings" not in paths

    event_get_params = {
        param["name"] for param in paths["/api/v1/events"]["get"]["parameters"]
    }
    assert event_get_params == {
        "title",
        "organizer_id",
        "organizer_name",
        "organizer_rating_min",
        "organizer_rating_max",
        "city",
        "lat",
        "lon",
        "radius_km",
        "date_from",
        "date_to",
        "cost_min",
        "cost_max",
        "available_seats_min",
        "sort_by",
        "sort_order",
        "page",
        "limit",
    }
    assert "/api/v1/events/my/created" in paths
    assert "/api/v1/events/my/participating" in paths
    assert "delete" in paths["/api/v1/events/{event_id}"]
    assert "patch" in paths["/api/v1/events/{event_id}"]


def test_validate_media_url() -> None:
    from app.modules.events.schemas import validate_media_url

    assert validate_media_url(None) is None
    assert validate_media_url("") is None
    assert validate_media_url("/media/events/cover.webp") == "/media/events/cover.webp"
    assert (
        validate_media_url("https://example.com/media/events/cover.webp")
        == "https://example.com/media/events/cover.webp"
    )

    with pytest.raises(
        ValueError, match="Photo URL must point to uploaded media storage"
    ):
        validate_media_url("https://external-site.com/hacked-image.jpg")

    with pytest.raises(
        ValueError, match="Photo URL must point to uploaded media storage"
    ):
        validate_media_url("ftp://somehost/image.png")


@pytest.mark.asyncio
async def test_get_public_event_permissions() -> None:
    import uuid
    from unittest.mock import AsyncMock

    from app.core.exceptions import NotFoundException
    from app.modules.events.service import EventService
    from app.modules.users.models import User

    event_repo = AsyncMock()
    service = EventService(event_repo)

    organizer_id = uuid.uuid7()
    organizer = User(id=organizer_id, email="org@example.com", first_name="Host")
    stranger = User(id=uuid.uuid7(), email="stranger@example.com", is_superuser=False)
    admin = User(id=uuid.uuid7(), email="admin@example.com", is_superuser=True)

    unmoderated_event = Event(
        id=uuid.uuid7(),
        organizer_id=organizer_id,
        organizer=organizer,
        title="Secret event",
        description="Desc",
        game_title="Game",
        address="Addr",
        city="Kyiv",
        lat=50.45,
        lon=30.52,
        start_datetime=datetime.now(UTC) + timedelta(days=1),
        min_players=2,
        max_players=4,
        current_confirmed=0,
        entry_cost=Decimal("0.00"),
        status=EventStatus.ON_MODERATION,
        is_verified=False,
        is_deleted=False,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    event_repo.get_by_id_with_organizer.return_value = unmoderated_event
    event_repo.is_event_favorite.return_value = False

    # Anonymous user cannot view unmoderated event
    with pytest.raises(NotFoundException):
        await service.get_public_event(unmoderated_event.id, current_user=None)

    # Stranger user cannot view unmoderated event
    with pytest.raises(NotFoundException):
        await service.get_public_event(unmoderated_event.id, current_user=stranger)

    # Organizer CAN view their own unmoderated event
    res_org = await service.get_public_event(
        unmoderated_event.id, current_user=organizer
    )
    assert res_org.id == unmoderated_event.id
    assert res_org.status == EventStatus.ON_MODERATION

    # Superadmin CAN view unmoderated event
    res_admin = await service.get_public_event(unmoderated_event.id, current_user=admin)
    assert res_admin.id == unmoderated_event.id


@pytest.mark.asyncio
async def test_update_event_permissions_and_rules() -> None:
    import uuid
    from unittest.mock import AsyncMock

    from app.core.exceptions import BadRequestException, ForbiddenException
    from app.modules.events.schemas import EventUpdate
    from app.modules.events.service import EventService
    from app.modules.users.models import User

    event_repo = AsyncMock()
    service = EventService(event_repo)

    organizer_id = uuid.uuid7()
    organizer = User(id=organizer_id, email="org@example.com", first_name="Host")
    stranger = User(id=uuid.uuid7(), email="stranger@example.com", is_superuser=False)

    event = Event(
        id=uuid.uuid7(),
        organizer_id=organizer_id,
        organizer=organizer,
        title="Original title",
        description="Desc",
        game_title="Game",
        address="Addr",
        city="Kyiv",
        lat=50.45,
        lon=30.52,
        start_datetime=datetime.now(UTC) + timedelta(days=2),
        min_players=2,
        max_players=6,
        current_confirmed=3,
        entry_cost=Decimal("0.00"),
        status=EventStatus.PUBLISHED,
        is_verified=True,
        is_deleted=False,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    event_repo.get_by_id_with_organizer.return_value = event
    event_repo.is_event_favorite.return_value = False

    # Stranger cannot update
    with pytest.raises(ForbiddenException, match="Only the event organizer can edit"):
        await service.update_event(
            event.id,
            stranger,
            EventUpdate(title="Hacked title"),
        )

    # Capacity cannot be reduced below current confirmed players (3)
    with pytest.raises(
        BadRequestException, match="max_players cannot be less than confirmed players"
    ):
        await service.update_event(
            event.id,
            organizer,
            EventUpdate(max_players=2),
        )

    # Successful update does not reset status
    updated_event = Event(
        id=event.id,
        organizer_id=organizer_id,
        organizer=organizer,
        title="Updated title",
        description="Desc",
        game_title="Game",
        address="Addr",
        city="Kyiv",
        lat=50.45,
        lon=30.52,
        start_datetime=event.start_datetime,
        min_players=2,
        max_players=8,
        current_confirmed=3,
        entry_cost=Decimal("0.00"),
        status=EventStatus.PUBLISHED,  # MUST PRESERVE STATUS
        is_verified=True,
        is_deleted=False,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    event_repo.update.return_value = updated_event
    event_repo.get_by_id_with_organizer.side_effect = [event, updated_event]

    res = await service.update_event(
        event.id,
        organizer,
        EventUpdate(title="Updated title", max_players=8),
    )
    assert res.title == "Updated title"
    assert res.status == EventStatus.PUBLISHED
