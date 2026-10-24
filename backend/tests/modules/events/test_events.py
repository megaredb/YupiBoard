from datetime import UTC, datetime, timedelta

import pytest
from pydantic import ValidationError

from app.main import app
from app.modules.events.models import Event, EventStatus
from app.modules.events.schemas import EventCreate, EventUpdate
from app.modules.events.types import Longitude


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
        "entry_cost": 0,
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
        ("lon", 181),
        ("min_players", 0),
        ("entry_cost", -0.01),
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
    data["end_datetime"] = data["start_datetime"] - timedelta(minutes=1)
    with pytest.raises(ValidationError, match="end_datetime must be later"):
        EventCreate.model_validate(data)


def test_event_update_can_clear_nullable_fields_but_not_required_fields() -> None:
    data = EventUpdate.model_validate({"end_datetime": None, "photo_url": None})
    assert data.model_fields_set == {"end_datetime", "photo_url"}

    with pytest.raises(ValidationError, match="title cannot be null"):
        EventUpdate.model_validate({"title": None})


def test_longitude_uses_a_separate_validated_database_type() -> None:
    longitude_type = Event.__table__.c.lon.type

    assert isinstance(longitude_type, Longitude)
    assert longitude_type.process_bind_param(-180, None) == -180
    with pytest.raises(ValueError, match="Longitude must be between"):
        longitude_type.process_bind_param(180.01, None)


def test_event_routes_are_registered() -> None:
    paths = app.openapi()["paths"]

    assert "/api/v1/events" in paths
    assert "/api/v1/events/{event_id}/applications" in paths
    assert "/api/v1/events/{event_id}/ratings" in paths
