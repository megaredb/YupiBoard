import uuid
from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.events.models import EventStatus
from app.modules.moderation.models import AdminAuditLog, AuditActionType


def _event_payload(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "title": "Twilight Imperium Strategy Day",
        "description": "Friendly 4-player epic space strategy game.",
        "game_title": "Twilight Imperium",
        "address": "Khreshchatyk St, 24",
        "city": "Kyiv",
        "lat": 50.4472,
        "lon": 30.5228,
        "start_datetime": (datetime.now(UTC) + timedelta(days=3)).isoformat(),
        "min_players": 2,
        "max_players": 4,
        "entry_cost": "50.00",
    }
    payload.update(overrides)
    return payload


@pytest.mark.asyncio
async def test_moderation_lifecycle_approve_reject_resubmit_and_audit_logs(
    async_client: AsyncClient, create_mock_user, db_session: AsyncSession
) -> None:
    _organizer, org_token = await create_mock_user(is_verified=True, is_superuser=False)
    _player, player_token = await create_mock_user(is_verified=True, is_superuser=False)
    admin, admin_token = await create_mock_user(is_verified=True, is_superuser=True)

    org_headers = {"Authorization": f"Bearer {org_token}"}
    player_headers = {"Authorization": f"Bearer {player_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Create clean event -> goes to OnModeration (NOT auto-approved)
    create_res = await async_client.post(
        "/api/v1/events", headers=org_headers, json=_event_payload()
    )
    assert create_res.status_code == 201
    created = create_res.json()
    event_id = created["event_id"]
    assert created["status"] == EventStatus.ON_MODERATION
    assert created["is_verified"] is False

    # Hidden from public catalog & stranger detail view
    cat_res = await async_client.get("/api/v1/events")
    assert all(item["id"] != event_id for item in cat_res.json()["items"])
    assert (
        await async_client.get(f"/api/v1/events/{event_id}", headers=player_headers)
    ).status_code == 404

    # Non-admin cannot access moderation endpoints
    assert (
        await async_client.get("/api/v1/moderation/events", headers=player_headers)
    ).status_code == 403
    assert (
        await async_client.post(
            f"/api/v1/moderation/events/{event_id}/approve", headers=player_headers
        )
    ).status_code == 403

    # 2. Admin sees event in moderation queue & rejects without reason -> 422
    # Newest first: the shared dev database may hold more than a page of older events.
    queue_res = await async_client.get(
        "/api/v1/moderation/events",
        params={"sort_by": "created_at", "sort_order": "desc"},
        headers=admin_headers,
    )
    assert queue_res.status_code == 200
    assert any(item["id"] == event_id for item in queue_res.json()["items"])

    bad_reject = await async_client.post(
        f"/api/v1/moderation/events/{event_id}/reject",
        headers=admin_headers,
        json={"reason": "no"},
    )
    assert bad_reject.status_code == 422

    # 3. Admin rejects with valid reason
    reject_res = await async_client.post(
        f"/api/v1/moderation/events/{event_id}/reject",
        headers=admin_headers,
        json={"reason": "Please add table rules in the description."},
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == EventStatus.REJECTED
    assert (
        reject_res.json()["rejection_reason"]
        == "Please add table rules in the description."
    )

    # Double review is rejected with 409 Conflict
    double_approve = await async_client.post(
        f"/api/v1/moderation/events/{event_id}/approve", headers=admin_headers
    )
    assert double_approve.status_code == 409

    # 4. Organizer edits rejected event -> automatically resubmitted to OnModeration
    patch_res = await async_client.patch(
        f"/api/v1/events/{event_id}",
        headers=org_headers,
        json={"description": "Full Twilight Imperium rules explained before start."},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == EventStatus.ON_MODERATION
    assert patch_res.json()["rejection_reason"] is None

    # 5. Admin approves -> Published & visible in catalog
    approve_res = await async_client.post(
        f"/api/v1/moderation/events/{event_id}/approve", headers=admin_headers
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == EventStatus.PUBLISHED
    assert approve_res.json()["is_verified"] is True

    cat_after = await async_client.get(
        "/api/v1/events",
        params={"title": "Twilight Imperium Strategy Day", "limit": 50},
    )
    assert any(item["id"] == event_id for item in cat_after.json()["items"])

    # 6. Audit logs recorded both actions
    logs_res = await async_client.get(
        "/api/v1/moderation/audit-logs", headers=admin_headers
    )
    assert logs_res.status_code == 200
    target_logs = [
        log for log in logs_res.json()["items"] if log["target_id"] == event_id
    ]
    assert {log["action_type"] for log in target_logs} == {
        AuditActionType.EVENT_REJECTED,
        AuditActionType.EVENT_APPROVED,
    }
    assert any(log["admin_id"] == str(admin.id) for log in target_logs)

    # Organizer received notifications for rejection and approval
    notif_res = await async_client.get("/api/v1/notifications", headers=org_headers)
    assert notif_res.status_code == 200
    types = {n["notification_type"] for n in notif_res.json()["items"]}
    assert {"EVENT_REJECTED", "EVENT_APPROVED"}.issubset(types)


@pytest.mark.asyncio
async def test_auto_moderation_rejects_forbidden_words_and_duplicates(
    async_client: AsyncClient, create_mock_user, db_session: AsyncSession
) -> None:
    _organizer, org_token = await create_mock_user(is_verified=True)
    headers = {"Authorization": f"Bearer {org_token}"}

    # Forbidden word -> auto-rejected
    bad_res = await async_client.post(
        "/api/v1/events",
        headers=headers,
        json=_event_payload(title="Underground Casino Poker Night"),
    )
    assert bad_res.status_code == 201
    bad_data = bad_res.json()
    assert bad_data["status"] == EventStatus.REJECTED
    assert bad_data["is_verified"] is False

    audit = await db_session.scalar(
        select(AdminAuditLog).where(
            AdminAuditLog.target_id == bad_data["event_id"],
            AdminAuditLog.action_type == AuditActionType.EVENT_AUTO_REJECTED,
        )
    )
    assert audit is not None
    assert audit.admin_id is None

    # Duplicate event at exact same start/city/address by same organizer -> auto-rejected
    start_dt = (datetime.now(UTC) + timedelta(days=4)).isoformat()
    first = await async_client.post(
        "/api/v1/events",
        headers=headers,
        json=_event_payload(title="Catan Table #1", start_datetime=start_dt),
    )
    assert first.status_code == 201
    assert first.json()["status"] == EventStatus.ON_MODERATION

    dup = await async_client.post(
        "/api/v1/events",
        headers=headers,
        json=_event_payload(title="Catan Table #2", start_datetime=start_dt),
    )
    assert dup.status_code == 201
    assert dup.json()["status"] == EventStatus.REJECTED


@pytest.mark.asyncio
async def test_moderation_queue_sorts_by_title_ignoring_case(
    async_client: AsyncClient, create_mock_user
) -> None:
    _organizer, org_token = await create_mock_user(is_verified=True, is_superuser=False)
    _admin, admin_token = await create_mock_user(is_verified=True, is_superuser=True)
    token = uuid.uuid4().hex[:8]
    for index, title in enumerate((f"bravo {token}", f"Alpha {token}")):
        res = await async_client.post(
            "/api/v1/events",
            headers={"Authorization": f"Bearer {org_token}"},
            json=_event_payload(
                title=title,
                start_datetime=(
                    datetime.now(UTC) + timedelta(days=3, hours=index)
                ).isoformat(),
            ),
        )
        assert res.status_code == 201

    queue_res = await async_client.get(
        "/api/v1/moderation/events",
        params={"q": token, "sort_by": "title", "sort_order": "asc"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert queue_res.status_code == 200
    titles = [item["title"] for item in queue_res.json()["items"]]
    assert titles == [f"Alpha {token}", f"bravo {token}"]
