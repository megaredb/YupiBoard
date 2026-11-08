import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock

import pytest
from httpx import AsyncClient
from pydantic import ValidationError

from app.core.exceptions import NotFoundException
from app.main import app
from app.modules.notifications.enums import (
    NOTIFICATION_CATEGORY,
    NotificationCategory,
    NotificationType,
    types_for,
)
from app.modules.notifications.models import Notification
from app.modules.notifications.repository import NOTIFICATION_RETENTION
from app.modules.notifications.schemas import (
    NotificationCreate,
    NotificationFilterParams,
    NotificationIdsRequest,
    NotificationMetadataFilter,
    NotificationRead,
)
from app.modules.notifications.service import NotificationService


def _notification(**overrides: object) -> Notification:
    fields: dict[str, object] = {
        "id": uuid.uuid7(),
        "user_id": uuid.uuid7(),
        "notification_type": NotificationType.BOOKING_APPROVED,
        "title": "Application Approved",
        "message": "Your application has been approved!",
        "is_read": False,
        "metadata_payload": {"booking_id": str(uuid.uuid7())},
        "created_at": datetime.now(UTC),
    }
    fields.update(overrides)
    return Notification(**fields)


# --- enums ---


def test_every_type_has_a_category() -> None:
    assert set(NOTIFICATION_CATEGORY) == set(NotificationType)


def test_srs_type_codes() -> None:
    assert NotificationType.REMINDER_24H == "REMINDER_24H"
    assert NotificationType.BOOKING_APPROVED == "BOOKING_APPROVED"
    assert NotificationType.WAITLIST_PROMOTED == "WAITLIST_PROMOTED"


def test_type_codes_fit_column_length() -> None:
    assert all(len(t.value) <= 50 for t in NotificationType)


def test_types_for_category() -> None:
    assert NotificationType.BOOKING_REQUESTED in types_for(
        NotificationCategory.REQUESTS
    )
    assert NotificationType.REMINDER_24H in types_for(
        NotificationCategory.EVENT_UPDATES
    )
    assert NotificationType.REMINDER_2H in types_for(NotificationCategory.EVENT_UPDATES)
    assert types_for(NotificationCategory.SYSTEM) == []


# --- schemas ---


def test_read_schema_exposes_metadata_payload_and_category() -> None:
    notification = _notification()
    data = NotificationRead.model_validate(notification).model_dump()

    assert data["metadata_payload"] == notification.metadata_payload
    assert data["category"] == NotificationCategory.REQUESTS


def test_ids_request_requires_between_1_and_100_ids() -> None:
    assert NotificationIdsRequest(ids=[uuid.uuid7()]).ids
    with pytest.raises(ValidationError):
        NotificationIdsRequest(ids=[])
    with pytest.raises(ValidationError):
        NotificationIdsRequest(ids=[uuid.uuid7() for _ in range(101)])


def test_metadata_filter_keeps_value_type_and_forbids_extra() -> None:
    assert NotificationMetadataFilter(key="booking_id", value="abc").value == "abc"
    assert NotificationMetadataFilter(key="seat", value=5).value == 5
    assert NotificationMetadataFilter(key="flag", value=True).value is True
    with pytest.raises(ValidationError):
        NotificationMetadataFilter(key="", value="x")
    with pytest.raises(ValidationError):
        NotificationMetadataFilter.model_validate(
            {"key": "k", "value": "x", "extra": 1}
        )


def test_create_schema_rejects_too_long_title() -> None:
    with pytest.raises(ValidationError):
        NotificationCreate(
            user_id=uuid.uuid7(),
            notification_type=NotificationType.EVENT_UPDATED,
            title="x" * 151,
            message="Venue changed",
        )


def test_filter_params_defaults_and_limits() -> None:
    params = NotificationFilterParams()
    assert (params.page, params.limit, params.category) == (1, 10, None)
    with pytest.raises(ValidationError):
        NotificationFilterParams(limit=101)


# --- service ---


@pytest.mark.asyncio
async def test_notify_creates_record_from_dto() -> None:
    repo = AsyncMock()
    service = NotificationService(repo)
    data = NotificationCreate(
        user_id=uuid.uuid7(),
        notification_type=NotificationType.BOOKING_REQUESTED,
        title="New Join Request",
        message="Taras B. sent a booking request",
        metadata_payload={"booking_id": "abc"},
    )

    await service.notify(data)

    repo.create_notification.assert_awaited_once_with(
        user_id=data.user_id,
        notification_type=data.notification_type,
        title=data.title,
        message=data.message,
        metadata_payload={"booking_id": "abc"},
    )


@pytest.mark.asyncio
async def test_notify_many_maps_dtos_to_model_fields() -> None:
    repo = AsyncMock()
    service = NotificationService(repo)
    items = [
        NotificationCreate(
            user_id=uuid.uuid7(),
            notification_type=NotificationType.EVENT_UPDATED,
            title="Venue changed",
            message="New venue",
            metadata_payload={"event_id": "e1"},
        )
        for _ in range(2)
    ]

    await service.notify_many(items)

    rows = repo.create_many.await_args.args[0]
    assert [r["user_id"] for r in rows] == [i.user_id for i in items]
    assert all(r["metadata_payload"] == {"event_id": "e1"} for r in rows)


@pytest.mark.asyncio
async def test_notify_many_skips_repo_for_empty_input() -> None:
    repo = AsyncMock()

    assert await NotificationService(repo).notify_many([]) == []

    repo.create_many.assert_not_awaited()


@pytest.mark.asyncio
async def test_list_translates_category_to_types() -> None:
    repo = AsyncMock()
    repo.list_for_user.return_value = ([], 0, 1)
    service = NotificationService(repo)
    user_id = uuid.uuid7()

    await service.list_for_user(
        user_id,
        NotificationFilterParams(category=NotificationCategory.EVENT_UPDATES),
    )

    kwargs = repo.list_for_user.await_args.kwargs
    assert kwargs["types"] == types_for(NotificationCategory.EVENT_UPDATES)


@pytest.mark.asyncio
async def test_list_without_category_does_not_filter_by_type() -> None:
    repo = AsyncMock()
    repo.list_for_user.return_value = ([], 0, 1)
    service = NotificationService(repo)

    await service.list_for_user(uuid.uuid7(), NotificationFilterParams())

    assert repo.list_for_user.await_args.kwargs["types"] is None


@pytest.mark.asyncio
async def test_counts_aggregate_types_into_categories() -> None:
    repo = AsyncMock()
    repo.count_by_type.return_value = [
        (NotificationType.BOOKING_APPROVED, 2, 1),
        (NotificationType.BOOKING_REQUESTED, 1, 1),
        (NotificationType.REMINDER_24H, 8, 1),
    ]
    service = NotificationService(repo)

    counts = await service.get_counts(uuid.uuid7())

    assert (counts.total, counts.unread) == (11, 3)
    requests = counts.by_category[NotificationCategory.REQUESTS]
    assert (requests.total, requests.unread) == (3, 2)
    updates = counts.by_category[NotificationCategory.EVENT_UPDATES]
    assert (updates.total, updates.unread) == (8, 1)
    system = counts.by_category[NotificationCategory.SYSTEM]
    assert (system.total, system.unread) == (0, 0)


@pytest.mark.asyncio
async def test_get_unread_count_delegates_to_repo() -> None:
    repo = AsyncMock()
    repo.count_unread.return_value = 4
    user_id = uuid.uuid7()

    assert await NotificationService(repo).get_unread_count(user_id) == 4

    repo.count_unread.assert_awaited_once_with(user_id)


@pytest.mark.asyncio
async def test_mark_as_read_rejects_missing_or_foreign_notification() -> None:
    repo = AsyncMock()
    repo.mark_read.return_value = None
    service = NotificationService(repo)

    with pytest.raises(NotFoundException, match="Notification not found"):
        await service.mark_as_read(uuid.uuid7(), uuid.uuid7())


@pytest.mark.asyncio
async def test_mark_as_read_returns_repo_result() -> None:
    repo = AsyncMock()
    notification = _notification(is_read=True)
    repo.mark_read.return_value = notification
    service = NotificationService(repo)

    result = await service.mark_as_read(notification.id, notification.user_id)

    assert result is notification
    repo.mark_read.assert_awaited_once_with(notification.id, notification.user_id)


@pytest.mark.asyncio
async def test_mark_as_unread_returns_repo_result() -> None:
    repo = AsyncMock()
    notification = _notification(is_read=False)
    repo.mark_unread.return_value = notification
    service = NotificationService(repo)

    result = await service.mark_as_unread(notification.id, notification.user_id)

    assert result is notification
    repo.mark_unread.assert_awaited_once_with(notification.id, notification.user_id)


@pytest.mark.asyncio
async def test_mark_as_unread_rejects_missing_notification() -> None:
    repo = AsyncMock()
    repo.mark_unread.return_value = None

    with pytest.raises(NotFoundException, match="Notification not found"):
        await NotificationService(repo).mark_as_unread(uuid.uuid7(), uuid.uuid7())


@pytest.mark.asyncio
async def test_mark_many_as_read_delegates_to_repo() -> None:
    repo = AsyncMock()
    repo.mark_many_read.return_value = 2
    ids = [uuid.uuid7(), uuid.uuid7()]
    user_id = uuid.uuid7()

    assert await NotificationService(repo).mark_many_as_read(ids, user_id) == 2

    repo.mark_many_read.assert_awaited_once_with(ids, user_id)


@pytest.mark.asyncio
async def test_metadata_operations_delegate_to_repo() -> None:
    repo = AsyncMock()
    repo.mark_read_by_metadata.return_value = 3
    repo.list_by_metadata.return_value = []
    service = NotificationService(repo)
    user_id = uuid.uuid7()
    booking_id = uuid.uuid7()

    assert (
        await service.mark_as_read_by_metadata(user_id, "booking_id", booking_id) == 3
    )
    await service.list_by_metadata(user_id, "booking_id", booking_id, is_read=False)

    repo.mark_read_by_metadata.assert_awaited_once_with(
        user_id, "booking_id", booking_id
    )
    repo.list_by_metadata.assert_awaited_once_with(
        user_id, "booking_id", booking_id, is_read=False
    )


@pytest.mark.asyncio
async def test_delete_rejects_missing_or_foreign_notification() -> None:
    repo = AsyncMock()
    repo.delete_for_user.return_value = False

    with pytest.raises(NotFoundException, match="Notification not found"):
        await NotificationService(repo).delete(uuid.uuid7(), uuid.uuid7())


@pytest.mark.asyncio
async def test_delete_succeeds_for_own_notification() -> None:
    repo = AsyncMock()
    repo.delete_for_user.return_value = True
    notification_id, user_id = uuid.uuid7(), uuid.uuid7()

    await NotificationService(repo).delete(notification_id, user_id)

    repo.delete_for_user.assert_awaited_once_with(notification_id, user_id)


@pytest.mark.asyncio
async def test_delete_all_passes_only_read_flag() -> None:
    repo = AsyncMock()
    repo.delete_all_for_user.return_value = 5
    user_id = uuid.uuid7()

    assert await NotificationService(repo).delete_all(user_id, only_read=True) == 5

    repo.delete_all_for_user.assert_awaited_once_with(user_id, only_read=True)


@pytest.mark.asyncio
async def test_purge_expired_uses_default_retention() -> None:
    repo = AsyncMock()
    repo.delete_expired.return_value = 7

    assert await NotificationService(repo).purge_expired() == 7

    repo.delete_expired.assert_awaited_once_with()


def test_retention_period_is_two_years() -> None:
    assert NOTIFICATION_RETENTION == timedelta(days=730)


# --- router ---


def test_notification_routes_are_registered() -> None:
    paths = app.openapi()["paths"]
    base = "/api/v1/notifications"
    assert {"get", "delete"} <= set(paths[base])
    assert "get" in paths[f"{base}/counts"]
    assert "get" in paths[f"{base}/unread-count"]
    assert "post" in paths[f"{base}/read"]
    assert "post" in paths[f"{base}/read-all"]
    assert "post" in paths[f"{base}/read-by-metadata"]
    assert "post" in paths[f"{base}/{{notification_id}}/read"]
    assert "post" in paths[f"{base}/{{notification_id}}/unread"]
    assert "delete" in paths[f"{base}/{{notification_id}}"]


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("GET", "/api/v1/notifications/unread-count"),
        ("POST", "/api/v1/notifications/read"),
        ("POST", "/api/v1/notifications/read-by-metadata"),
        ("POST", f"/api/v1/notifications/{uuid.uuid7()}/unread"),
        ("DELETE", "/api/v1/notifications"),
        ("DELETE", f"/api/v1/notifications/{uuid.uuid7()}"),
    ],
)
async def test_new_endpoints_require_authentication(
    async_client: AsyncClient, method: str, path: str
) -> None:
    response = await async_client.request(method, path)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_requires_authentication(async_client: AsyncClient) -> None:
    response = await async_client.get("/api/v1/notifications")
    assert response.status_code == 401
