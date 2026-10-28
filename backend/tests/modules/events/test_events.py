from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from pydantic import ValidationError
from sqlalchemy import Float

from app.main import app
from app.modules.events.models import Event, EventStatus
from app.modules.events.schemas import EventCreate


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
    data["end_datetime"] = data["start_datetime"] - timedelta(minutes=1)
    with pytest.raises(ValidationError, match="end_datetime must be later"):
        EventCreate.model_validate(data)

    data = valid_event_data()
    data["start_datetime"] = datetime.now(UTC) - timedelta(minutes=5)
    with pytest.raises(ValidationError, match="start_datetime must be in the future"):
        EventCreate.model_validate(data)


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
    assert "city" in event_get_params
    assert "lat" in event_get_params
    assert "lon" in event_get_params
    assert "radius_km" in event_get_params
    assert "limit" in event_get_params
    assert "page" in event_get_params
