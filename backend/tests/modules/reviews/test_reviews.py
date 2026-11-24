import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock

import pytest
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestException, ForbiddenException
from app.main import app
from app.modules.bookings.models import Booking, BookingStatus
from app.modules.bookings.repository import BookingRepository
from app.modules.events.models import Event, EventStatus
from app.modules.events.repository import EventRepository
from app.modules.reviews.models import Review, ReviewTargetRole
from app.modules.reviews.repository import ReviewRepository
from app.modules.reviews.schemas import ReviewCreate
from app.modules.reviews.service import ReviewService
from app.modules.users.models import User
from app.modules.users.repository import UserRepository


def _event(
    organizer_id: uuid.UUID,
    *,
    end_offset: timedelta = timedelta(hours=-1),
    status: EventStatus = EventStatus.COMPLETED,
) -> Event:
    now = datetime.now(UTC)
    return Event(
        id=uuid.uuid7(),
        organizer_id=organizer_id,
        title="Catan night",
        status=status,
        is_deleted=False,
        start_datetime=now + end_offset - timedelta(hours=3),
        end_datetime=now + end_offset,
    )


def _service(
    event: Event, booking_status: BookingStatus | None, reviewee: User
) -> tuple[ReviewService, AsyncMock, AsyncMock]:
    review_repo = AsyncMock()
    event_repo = AsyncMock()
    booking_repo = AsyncMock()
    user_repo = AsyncMock()
    event_repo.get_by_id.return_value = event
    booking_repo.get_latest_for_user.return_value = (
        Booking(id=uuid.uuid7(), status=booking_status)
        if booking_status is not None
        else None
    )
    user_repo.lock_by_id.return_value = reviewee
    review_repo.get_for_pair.return_value = None
    review_repo.create.side_effect = lambda **kw: Review(id=uuid.uuid7(), **kw)
    service = ReviewService(review_repo, event_repo, booking_repo, user_repo)
    return service, review_repo, user_repo


def test_review_routes_are_registered() -> None:
    paths = app.openapi()["paths"]
    assert "put" in paths["/api/v1/events/{event_id}/reviews/organizer"]
    assert "put" in paths["/api/v1/events/{event_id}/reviews/players/{user_id}"]
    assert "get" in paths["/api/v1/events/{event_id}/reviews/me"]


@pytest.mark.parametrize("score", [0, 6, -1])
def test_review_score_must_be_one_to_five(score: int) -> None:
    with pytest.raises(ValidationError):
        ReviewCreate(score=score)


@pytest.mark.asyncio
async def test_attended_player_rates_organizer() -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    player = User(id=uuid.uuid7(), email="p@example.com")
    event = _event(organizer.id)
    service, _, user_repo = _service(event, BookingStatus.ATTENDED, organizer)

    review = await service.rate_organizer(event.id, player, 5)

    assert review.reviewee_id == organizer.id
    assert review.target_role == ReviewTargetRole.ORGANIZER
    assert review.score == 5
    user_repo.lock_by_id.assert_awaited_once_with(organizer.id)


@pytest.mark.asyncio
async def test_repeat_review_updates_existing_score() -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    player = User(id=uuid.uuid7(), email="p@example.com")
    event = _event(organizer.id)
    service, review_repo, _ = _service(event, BookingStatus.ATTENDED, organizer)
    existing = Review(
        id=uuid.uuid7(),
        event_id=event.id,
        reviewer_id=player.id,
        reviewee_id=organizer.id,
        target_role=ReviewTargetRole.ORGANIZER,
        score=2,
    )
    review_repo.get_for_pair.return_value = existing

    await service.rate_organizer(event.id, player, 4)

    review_repo.create.assert_not_awaited()
    review_repo.update.assert_awaited_once_with(existing, score=4)


@pytest.mark.parametrize(
    "booking_status", [None, BookingStatus.CONFIRMED, BookingStatus.NO_SHOW]
)
@pytest.mark.asyncio
async def test_not_attended_player_cannot_rate_organizer(
    booking_status: BookingStatus | None,
) -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    player = User(id=uuid.uuid7(), email="p@example.com")
    event = _event(organizer.id)
    service, _, _ = _service(event, booking_status, organizer)

    with pytest.raises(ForbiddenException, match="marked as attended"):
        await service.rate_organizer(event.id, player, 5)


@pytest.mark.asyncio
async def test_attended_player_rates_organizer_during_event() -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    player = User(id=uuid.uuid7(), email="p@example.com")
    event = _event(
        organizer.id, end_offset=timedelta(hours=1), status=EventStatus.ONGOING
    )
    service, review_repo, _ = _service(event, BookingStatus.ATTENDED, organizer)
    review_repo.list_by_reviewer.return_value = []

    review = await service.rate_organizer(event.id, player, 5)
    _, can_review, _ = await service.get_my_reviews(event.id, player)

    assert review.target_role == ReviewTargetRole.ORGANIZER
    assert can_review is True


@pytest.mark.asyncio
async def test_organizer_rating_before_event_start_is_rejected() -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    player = User(id=uuid.uuid7(), email="p@example.com")
    event = _event(
        organizer.id, end_offset=timedelta(hours=5), status=EventStatus.PUBLISHED
    )
    service, _, _ = _service(event, BookingStatus.ATTENDED, organizer)

    with pytest.raises(BadRequestException, match="once the event starts"):
        await service.rate_organizer(event.id, player, 5)


@pytest.mark.asyncio
async def test_organizer_rates_player_during_event() -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    player = User(id=uuid.uuid7(), email="p@example.com")
    event = _event(
        organizer.id, end_offset=timedelta(hours=1), status=EventStatus.ONGOING
    )
    service, review_repo, _ = _service(event, BookingStatus.ATTENDED, player)
    review_repo.list_by_reviewer.return_value = []

    review = await service.rate_player(event.id, organizer, player.id, 3)
    _, can_review, _ = await service.get_my_reviews(event.id, organizer)

    assert review.target_role == ReviewTargetRole.PLAYER
    assert can_review is True


@pytest.mark.asyncio
async def test_player_rating_before_event_start_is_rejected() -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    player = User(id=uuid.uuid7(), email="p@example.com")
    event = _event(
        organizer.id, end_offset=timedelta(hours=5), status=EventStatus.PUBLISHED
    )
    service, _, _ = _service(event, BookingStatus.ATTENDED, player)

    with pytest.raises(BadRequestException, match="once the event starts"):
        await service.rate_player(event.id, organizer, player.id, 3)


@pytest.mark.asyncio
async def test_review_after_48h_window_is_rejected() -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    player = User(id=uuid.uuid7(), email="p@example.com")
    event = _event(organizer.id, end_offset=timedelta(hours=-49))
    service, _, _ = _service(event, BookingStatus.ATTENDED, organizer)

    with pytest.raises(BadRequestException, match="Review window is closed"):
        await service.rate_organizer(event.id, player, 5)


@pytest.mark.asyncio
async def test_review_for_cancelled_event_is_rejected() -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    player = User(id=uuid.uuid7(), email="p@example.com")
    event = _event(organizer.id, status=EventStatus.CANCELLED)
    service, _, _ = _service(event, BookingStatus.ATTENDED, organizer)

    with pytest.raises(BadRequestException, match="did not take place"):
        await service.rate_organizer(event.id, player, 5)


@pytest.mark.asyncio
async def test_organizer_cannot_rate_themselves() -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    event = _event(organizer.id)
    service, _, _ = _service(event, BookingStatus.ATTENDED, organizer)

    with pytest.raises(BadRequestException, match="cannot rate themselves"):
        await service.rate_organizer(event.id, organizer, 5)


@pytest.mark.asyncio
async def test_organizer_rates_attended_player() -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    player = User(id=uuid.uuid7(), email="p@example.com")
    event = _event(organizer.id)
    service, _, user_repo = _service(event, BookingStatus.ATTENDED, player)

    review = await service.rate_player(event.id, organizer, player.id, 3)

    assert review.reviewee_id == player.id
    assert review.target_role == ReviewTargetRole.PLAYER
    user_repo.lock_by_id.assert_awaited_once_with(player.id)


@pytest.mark.asyncio
async def test_only_event_organizer_can_rate_players() -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    admin = User(id=uuid.uuid7(), email="x@example.com", is_superuser=True)
    player = User(id=uuid.uuid7(), email="p@example.com")
    event = _event(organizer.id)
    service, _, _ = _service(event, BookingStatus.ATTENDED, player)

    with pytest.raises(ForbiddenException, match="Only the event organizer"):
        await service.rate_player(event.id, admin, player.id, 3)


@pytest.mark.asyncio
async def test_organizer_cannot_rate_not_attended_player() -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    player = User(id=uuid.uuid7(), email="p@example.com")
    event = _event(organizer.id)
    service, _, _ = _service(event, BookingStatus.NO_SHOW, player)

    with pytest.raises(BadRequestException, match="marked as attended"):
        await service.rate_player(event.id, organizer, player.id, 3)


@pytest.mark.asyncio
async def test_get_my_reviews_reports_window_and_permission() -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    player = User(id=uuid.uuid7(), email="p@example.com")
    event = _event(organizer.id)
    service, review_repo, _ = _service(event, BookingStatus.ATTENDED, organizer)
    review_repo.list_by_reviewer.return_value = []

    deadline, can_review, reviews = await service.get_my_reviews(event.id, player)
    assert deadline == event.end_datetime + timedelta(hours=48)
    assert can_review is True
    assert reviews == []

    closed = _event(organizer.id, end_offset=timedelta(hours=-50))
    service, review_repo, _ = _service(closed, BookingStatus.ATTENDED, organizer)
    review_repo.list_by_reviewer.return_value = []
    _, can_review, _ = await service.get_my_reviews(closed.id, organizer)
    assert can_review is False


@pytest.mark.asyncio
async def test_review_rows_keep_reviewee_ratings_in_step(
    db_session: AsyncSession,
) -> None:
    users = UserRepository(db_session)
    organizer = await users.create(
        email=f"org_{uuid.uuid7().hex}@example.com", hashed_password="x"
    )
    players = [
        await users.create(
            email=f"p_{uuid.uuid7().hex}@example.com", hashed_password="x"
        )
        for _ in range(3)
    ]
    now = datetime.now(UTC)
    event = await EventRepository(db_session).create(
        organizer_id=organizer.id,
        title="Review aggregation",
        description="Desc",
        game_title="Catan",
        address="Main street 1",
        city="Kyiv",
        lat=50.45,
        lon=30.52,
        start_datetime=now - timedelta(hours=5),
        end_datetime=now - timedelta(hours=1),
        max_players=4,
        entry_cost=Decimal("0.00"),
        status=EventStatus.COMPLETED,
        is_verified=True,
    )
    reviews = ReviewRepository(db_session)
    created = [
        await reviews.create(
            event_id=event.id,
            reviewer_id=player.id,
            reviewee_id=organizer.id,
            target_role=ReviewTargetRole.ORGANIZER,
            score=score,
        )
        for player, score in zip(players, (5, 5, 4), strict=True)
    ]
    await reviews.create(
        event_id=event.id,
        reviewer_id=organizer.id,
        reviewee_id=players[0].id,
        target_role=ReviewTargetRole.PLAYER,
        score=1,
    )

    await db_session.refresh(organizer)
    assert organizer.rating_as_organizer == Decimal("4.67")
    assert organizer.rating_as_organizer_count == 3
    assert organizer.rating_as_player is None

    await reviews.update(created[2], score=2)
    await db_session.refresh(organizer)
    assert organizer.rating_as_organizer == Decimal("4.00")

    await db_session.refresh(players[0])
    assert players[0].rating_as_player == Decimal("1.00")
    assert players[0].rating_as_player_count == 1
    await db_session.refresh(players[1])
    assert players[1].rating_as_player_count == 0
    # The tests share the development database; leave nothing behind.
    await db_session.rollback()


@pytest.mark.asyncio
async def test_deleting_pair_reviews_recomputes_ratings(
    db_session: AsyncSession,
) -> None:
    users = UserRepository(db_session)
    organizer = await users.create(
        email=f"org_{uuid.uuid7().hex}@example.com", hashed_password="x"
    )
    player, other = [
        await users.create(
            email=f"p_{uuid.uuid7().hex}@example.com", hashed_password="x"
        )
        for _ in range(2)
    ]
    now = datetime.now(UTC)
    event = await EventRepository(db_session).create(
        organizer_id=organizer.id,
        title="Revoked attendance",
        description="Desc",
        game_title="Catan",
        address="Main street 1",
        city="Kyiv",
        lat=50.45,
        lon=30.52,
        start_datetime=now - timedelta(hours=1),
        end_datetime=now + timedelta(hours=1),
        max_players=4,
        entry_cost=Decimal("0.00"),
        status=EventStatus.ONGOING,
        is_verified=True,
    )
    reviews = ReviewRepository(db_session)
    for reviewer, reviewee, role, score in (
        (player, organizer, ReviewTargetRole.ORGANIZER, 1),
        (other, organizer, ReviewTargetRole.ORGANIZER, 5),
        (organizer, player, ReviewTargetRole.PLAYER, 2),
    ):
        await reviews.create(
            event_id=event.id,
            reviewer_id=reviewer.id,
            reviewee_id=reviewee.id,
            target_role=role,
            score=score,
        )

    await BookingRepository(db_session).delete_reviews_between(
        event.id, organizer.id, player.id
    )

    await db_session.refresh(organizer)
    assert organizer.rating_as_organizer == Decimal("5.00")
    assert organizer.rating_as_organizer_count == 1
    await db_session.refresh(player)
    assert player.rating_as_player is None
    assert player.rating_as_player_count == 0
    # The tests share the development database; leave nothing behind.
    await db_session.rollback()
