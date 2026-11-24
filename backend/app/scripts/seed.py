"""Development/QA test data: one account per role and one event per scenario.

Every account uses the password ``Password123!``. ``pnpm be seed`` only inserts; run
``pnpm be seed:remove`` first when seed data is already there (times are relative to "now",
so re-seeding also refreshes scenarios like the "running now" event). See ``SEED_GUIDE``
below for what each account can test.
"""

import argparse
import asyncio
import logging
import shutil
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path

from sqlalchemy import delete, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import async_session_maker
from app.core.security import get_password_hash
from app.modules.bookings.models import Booking, BookingStatus
from app.modules.events.models import AutoCheckStatus, Event, EventStatus
from app.modules.favorites.models import Favorite
from app.modules.moderation.models import AdminAuditLog, AuditActionType
from app.modules.notifications.enums import NotificationType
from app.modules.notifications.models import Notification
from app.modules.reviews.models import Review, ReviewTargetRole
from app.modules.users.enums import UserStatus
from app.modules.users.models import User

logger = logging.getLogger("yupiboard.seed")

SEED_PASSWORD = "Password123!"

COVER_SOURCE = Path(__file__).parent / "seed_assets" / "event-cover.webp"
COVER_MEDIA_PATH = "events/seed-event-cover.webp"


@dataclass(frozen=True)
class SeedUser:
    key: str
    email: str
    first_name: str | None
    last_name: str | None
    city: str | None
    bio: str | None = None
    is_verified: bool = True
    is_superuser: bool = False
    status: UserStatus = UserStatus.ACTIVE


SEED_USERS = [
    SeedUser("admin", "admin@example.com", "Admin", "YupiBoard", "Kharkiv",
             "Platform moderator.", is_superuser=True),
    SeedUser("org1", "organizer1@example.com", "Olena", "Kovalenko", "Kharkiv",
             "Eurogames host in Kharkiv."),
    SeedUser("org2", "organizer2@example.com", "Taras", "Shevchuk", "Lviv",
             "Campaign and strategy nights."),
    SeedUser("p1", "player1@example.com", "Andrii", "Melnyk", "Kharkiv",
             "Always up for Dune or Brass."),
    SeedUser("p2", "player2@example.com", "Sofia", "Bondar", "Kharkiv",
             "Party games and deckbuilders."),
    SeedUser("p3", "player3@example.com", "Dmytro", "Tkachenko", "Lviv",
             "Sci-fi and RPG fan."),
    SeedUser("p4", "player4@example.com", "Iryna", "Savchenko", "Kharkiv"),
    SeedUser("p5", "player5@example.com", "Maksym", "Lysenko", "Kharkiv"),
    SeedUser("unverified", "unverified@example.com", "Nina", "Unverified", "Kharkiv",
             is_verified=False),
    SeedUser("incomplete", "incomplete@example.com", None, None, None),
    SeedUser("banned", "banned@example.com", "Bohdan", "Banned", "Kharkiv",
             status=UserStatus.BANNED),
    SeedUser("deleteme", "deleteme@example.com", "Dana", "Deleteme", "Kharkiv"),
]  # fmt: skip

SEED_USER_EMAILS = [user.email for user in SEED_USERS]

SEED_GUIDE = """
Seed accounts (password: Password123!)
  admin@example.com        moderation queue: 3 pending (auto-check passed/unavailable), rejected, auto-rejected
  organizer1@example.com   Catan: accept/decline 2 requests | Brass: full table + waitlist
                           Terraforming Mars (running): mark attendance | Ticket to Ride: rate players
  organizer2@example.com   Dune (a disqualified player), Lviv event, pending + rejected events
  player1@example.com      confirmed seats, waiting for attendance, rated organizer, favorites
  player2@example.com      pending request, attended Ticket to Ride (rate the organizer)
  player3@example.com      Lviv player, no-shows
  player4@example.com      self-joined waitlist on Brass (organizer can still accept)
  player5@example.com      accepted waitlist on Brass (auto-confirmed when a seat frees),
                           disqualified from Dune
  unverified@example.com   cannot create events (email not verified)
  incomplete@example.com   no name yet: lands on "complete your profile"
  banned@example.com       banned account: sign-in is refused
  deleteme@example.com     nothing organized: "Delete my profile" succeeds
"""


@dataclass(frozen=True)
class Venue:
    name: str
    address: str
    city: str
    lat: float
    lon: float


KHARKIV_CENTRE = Venue("Geek Pub", "Sumska St, 10", "Kharkiv", 49.9947, 36.2338)
KHARKIV_PUSHKINSKA = Venue(
    "Board & Brew", "Pushkinska St, 32", "Kharkiv", 49.9973, 36.2414
)
KHARKIV_NAUKY = Venue("Meeple House", "Nauky Ave, 27", "Kharkiv", 50.0130, 36.2275)
KHARKIV_SALTIVKA = Venue(
    "Tabletop Club", "Heroiv Pratsi St, 7", "Kharkiv", 50.0270, 36.3330
)
KHARKIV_HAHARINA = Venue("Dice Cafe", "Haharina Ave, 20", "Kharkiv", 49.9780, 36.2610)
KHARKIV_FAR = Venue(
    "Merefa Board Club", "Dniprovska St, 140, Merefa", "Kharkiv", 49.8230, 36.0530
)
LVIV_CENTRE = Venue("Lviv Dice Hall", "Rynok Square, 1", "Lviv", 49.8419, 24.0315)


@dataclass(frozen=True)
class SeedEvent:
    key: str
    organizer: str
    title: str
    game_title: str
    description: str
    venue: Venue
    starts_in: timedelta
    max_players: int
    cost: int
    status: EventStatus = EventStatus.PUBLISHED
    auto_check: AutoCheckStatus = AutoCheckStatus.PASSED
    rejection_reason: str | None = None
    is_promoted: bool = False
    duration: timedelta = timedelta(hours=4)
    bookings: dict[str, BookingStatus] = field(default_factory=dict)
    preapproved_waitlist: frozenset[str] = frozenset()
    booking_rejection_reasons: dict[str, str] = field(default_factory=dict)


B = BookingStatus
DAY = timedelta(days=1)
HOUR = timedelta(hours=1)

SEED_EVENTS = [
    SeedEvent(
        "catan", "org1", "Catan Friday Night", "Catan",
        "Relaxed Catan for newcomers and regulars. Two requests wait for the host.",
        KHARKIV_CENTRE, 2 * DAY, max_players=5, cost=0, is_promoted=True,
        bookings={"p1": B.CONFIRMED, "p2": B.PENDING, "p4": B.PENDING},
    ),
    SeedEvent(
        "brass", "org1", "Brass: Birmingham Full Table", "Brass: Birmingham",
        "Heavy economic strategy. The table is full and two players wait for a seat.",
        KHARKIV_PUSHKINSKA, 3 * DAY, max_players=3, cost=150,
        bookings={"p1": B.CONFIRMED, "p2": B.CONFIRMED, "p3": B.CONFIRMED,
                  "p4": B.WAITLIST, "p5": B.WAITLIST},
        preapproved_waitlist=frozenset({"p5"}),
    ),
    SeedEvent(
        "dune", "org2", "Dune: Imperium Evening", "Dune: Imperium",
        "Competitive Dune with the Rise of Ix expansion.",
        KHARKIV_NAUKY, 5 * DAY, max_players=4, cost=200,
        bookings={"p4": B.CONFIRMED, "p5": B.REJECTED},
        booking_rejection_reasons={"p5": "Seat reserved for a regular group member"},
    ),
    SeedEvent(
        "wingspan", "org1", "Wingspan Morning in Merefa", "Wingspan",
        "Calm engine-building over coffee, about 23 km from the centre.",
        KHARKIV_FAR, 1 * DAY, max_players=4, cost=80,
    ),
    SeedEvent(
        "gloomhaven", "org2", "Gloomhaven Campaign, Session 3", "Gloomhaven",
        "Ongoing campaign in Lviv; new players welcome.",
        LVIV_CENTRE, 4 * DAY, max_players=4, cost=100, bookings={"p3": B.CONFIRMED},
    ),
    SeedEvent(
        "root", "org1", "Root for Newcomers", "Root",
        "Teaching game of Root. Waiting for moderation.",
        KHARKIV_SALTIVKA, 6 * DAY, max_players=4, cost=0, status=EventStatus.ON_MODERATION,
    ),
    SeedEvent(
        "twilight", "org2", "Twilight Imperium Marathon", "Twilight Imperium",
        "All-day galactic epic. The automatic check could not run for this one.",
        KHARKIV_HAHARINA, 8 * DAY, max_players=6, cost=300,
        status=EventStatus.ON_MODERATION, auto_check=AutoCheckStatus.UNAVAILABLE,
    ),
    SeedEvent(
        "azul", "org1", "Azul Tournament", "Azul",
        "Swiss-format Azul tournament with prizes.",
        LVIV_CENTRE, 7 * DAY, max_players=8, cost=120, status=EventStatus.ON_MODERATION,
    ),
    SeedEvent(
        "mystery", "org2", "Mystery Meetup", "Catan",
        "Board game meetup.",
        KHARKIV_CENTRE, 4 * DAY, max_players=4, cost=0, status=EventStatus.REJECTED,
        rejection_reason="Inaccurate details",
    ),
    SeedEvent(
        "casino", "org2", "Casino Night", "Poker",
        "Gambling night with real stakes.",
        KHARKIV_PUSHKINSKA, 3 * DAY, max_players=6, cost=500, status=EventStatus.REJECTED,
        auto_check=AutoCheckStatus.FAILED,
        rejection_reason=(
            "Event content violates platform moderation guidelines "
            "(prohibited content detected)."
        ),
    ),
    SeedEvent(
        "mars", "org1", "Terraforming Mars (running now)", "Terraforming Mars",
        "Started an hour ago: the host can mark attendance.",
        KHARKIV_NAUKY, -1 * HOUR, max_players=5, cost=80,
        bookings={"p1": B.CONFIRMED, "p2": B.ATTENDED, "p3": B.NO_SHOW},
    ),
    SeedEvent(
        "ticket", "org1", "Ticket to Ride Evening (just ended)", "Ticket to Ride",
        "Ended two hours ago: attendance and ratings are open for 48 hours.",
        KHARKIV_CENTRE, -6 * HOUR, max_players=5, cost=0, status=EventStatus.COMPLETED,
        bookings={"p1": B.ATTENDED, "p2": B.ATTENDED, "p3": B.NO_SHOW,
                  "p4": B.CONFIRMED},
    ),
    SeedEvent(
        "carcassonne", "org1", "Carcassonne Classic (last week)", "Carcassonne",
        "Finished last week: attendance and ratings are final.",
        KHARKIV_PUSHKINSKA, -6 * DAY, max_players=4, cost=50, status=EventStatus.COMPLETED,
        bookings={"p1": B.ATTENDED, "p2": B.ATTENDED},
    ),
    SeedEvent(
        "scythe", "org2", "Scythe Tournament (cancelled)", "Scythe",
        "Cancelled because of venue maintenance.",
        KHARKIV_SALTIVKA, 7 * DAY, max_players=5, cost=120, status=EventStatus.CANCELLED,
        bookings={"p1": B.CANCELLED_BY_SYSTEM},
    ),
]  # fmt: skip

SEED_REVIEWS = [
    ("ticket", "p1", "org1", ReviewTargetRole.ORGANIZER, 5),
    ("ticket", "org1", "p1", ReviewTargetRole.PLAYER, 4),
    ("carcassonne", "p1", "org1", ReviewTargetRole.ORGANIZER, 4),
    ("carcassonne", "p2", "org1", ReviewTargetRole.ORGANIZER, 5),
    ("carcassonne", "org1", "p1", ReviewTargetRole.PLAYER, 5),
    ("carcassonne", "org1", "p2", ReviewTargetRole.PLAYER, 4),
]

SEED_FAVORITES = [("p1", "catan"), ("p1", "wingspan"), ("p1", "gloomhaven")]

SEATED_STATUSES = {B.CONFIRMED, B.ATTENDED, B.NO_SHOW}
RATING_PRECISION = Decimal("0.01")


async def remove_seed_data(session: AsyncSession) -> int:
    if settings.is_production:
        raise RuntimeError("Seeding is disabled when ENVIRONMENT=production")
    user_ids = list(
        (
            await session.scalars(
                select(User.id).where(User.email.in_(SEED_USER_EMAILS))
            )
        ).all()
    )
    if not user_ids:
        return 0
    event_ids = list(
        (
            await session.scalars(
                select(Event.id).where(Event.organizer_id.in_(user_ids))
            )
        ).all()
    )
    await session.execute(
        delete(AdminAuditLog).where(
            or_(
                AdminAuditLog.admin_id.in_(user_ids),
                AdminAuditLog.target_id.in_(event_ids),
            )
        )
    )
    # Bookings, reviews, favorites and notifications cascade with users and events.
    await session.execute(delete(Event).where(Event.id.in_(event_ids)))
    await session.execute(delete(User).where(User.id.in_(user_ids)))
    await session.flush()
    return len(user_ids)


async def _create_users(session: AsyncSession) -> dict[str, User]:
    pwd_hash = get_password_hash(SEED_PASSWORD)
    users: dict[str, User] = {}
    for spec in SEED_USERS:
        user = User(
            email=spec.email,
            hashed_password=pwd_hash,
            first_name=spec.first_name,
            last_name=spec.last_name,
            city=spec.city,
            bio=spec.bio,
            is_verified=spec.is_verified,
            is_superuser=spec.is_superuser,
            status=spec.status,
            is_deleted=False,
        )
        session.add(user)
        users[spec.key] = user
    await session.flush()
    return users


def _build_event(
    spec: SeedEvent, users: dict[str, User], admin: User, now: datetime
) -> Event:
    start = now + spec.starts_in
    is_decided = spec.status != EventStatus.ON_MODERATION
    is_auto_rejected = spec.auto_check == AutoCheckStatus.FAILED
    seated = sum(1 for status in spec.bookings.values() if status in SEATED_STATUSES)
    return Event(
        organizer_id=users[spec.organizer].id,
        title=spec.title,
        description=spec.description,
        game_title=spec.game_title,
        location_name=spec.venue.name,
        address=spec.venue.address,
        city=spec.venue.city,
        lat=spec.venue.lat,
        lon=spec.venue.lon,
        start_datetime=start,
        end_datetime=start + spec.duration,
        min_players=2,
        max_players=spec.max_players,
        current_confirmed=seated,
        entry_cost=Decimal(spec.cost),
        status=spec.status,
        rejection_reason=spec.rejection_reason,
        is_verified=spec.status
        in {EventStatus.PUBLISHED, EventStatus.COMPLETED, EventStatus.CANCELLED},
        promoted_to_datetime=now + 7 * DAY if spec.is_promoted else None,
        auto_check_status=spec.auto_check,
        moderated_by_id=admin.id if is_decided and not is_auto_rejected else None,
        moderated_at=start - 10 * DAY if is_decided and not is_auto_rejected else None,
        photo_url=f"/media/{COVER_MEDIA_PATH}",
        is_deleted=False,
    )


def _cover_target() -> Path:
    return Path(settings.MEDIA_DIR) / COVER_MEDIA_PATH


async def _create_events(
    session: AsyncSession, users: dict[str, User], now: datetime
) -> dict[str, Event]:
    admin = users["admin"]
    events = {spec.key: _build_event(spec, users, admin, now) for spec in SEED_EVENTS}
    session.add_all(events.values())
    await session.flush()

    for spec in SEED_EVENTS:
        event = events[spec.key]
        for user_key, status in spec.bookings.items():
            session.add(
                Booking(
                    event_id=event.id,
                    user_id=users[user_key].id,
                    status=status,
                    is_preapproved=user_key in spec.preapproved_waitlist,
                    rejection_reason=spec.booking_rejection_reasons.get(user_key),
                )
            )
        if spec.status == EventStatus.REJECTED:
            is_auto = spec.auto_check == AutoCheckStatus.FAILED
            session.add(
                AdminAuditLog(
                    admin_id=None if is_auto else admin.id,
                    action_type=(
                        AuditActionType.EVENT_AUTO_REJECTED
                        if is_auto
                        else AuditActionType.EVENT_REJECTED
                    ),
                    target_entity="Event",
                    target_id=event.id,
                    justification_reason=spec.rejection_reason,
                )
            )
    return events


async def _create_reviews(
    session: AsyncSession, users: dict[str, User], events: dict[str, Event]
) -> None:
    scores: dict[tuple[str, ReviewTargetRole], list[int]] = defaultdict(list)
    for event_key, reviewer, reviewee, role, score in SEED_REVIEWS:
        session.add(
            Review(
                event_id=events[event_key].id,
                reviewer_id=users[reviewer].id,
                reviewee_id=users[reviewee].id,
                target_role=role,
                score=score,
            )
        )
        scores[(reviewee, role)].append(score)

    for (user_key, role), values in scores.items():
        average = (Decimal(sum(values)) / len(values)).quantize(
            RATING_PRECISION, rounding=ROUND_HALF_UP
        )
        user = users[user_key]
        if role == ReviewTargetRole.ORGANIZER:
            user.rating_as_organizer = average
            user.rating_as_organizer_count = len(values)
        else:
            user.rating_as_player = average
            user.rating_as_player_count = len(values)


def _notifications(
    users: dict[str, User], events: dict[str, Event]
) -> list[Notification]:
    def note(
        user: str, kind: NotificationType, title: str, message: str, event: str
    ) -> Notification:
        return Notification(
            user_id=users[user].id,
            notification_type=kind,
            title=title,
            message=message,
            metadata_payload={
                "event_id": str(events[event].id),
                "event_title": events[event].title,
            },
        )

    catan, brass = events["catan"].title, events["brass"].title
    return [
        note("org1", NotificationType.BOOKING_REQUESTED, "New Booking Request",
             f"Sofia Bondar requested a seat at {catan}.", "catan"),
        note("org1", NotificationType.BOOKING_REQUESTED, "New Booking Request",
             f"Iryna Savchenko requested a seat at {catan}.", "catan"),
        note("p1", NotificationType.BOOKING_APPROVED, "Application Approved",
             "Great news! Host Olena Kovalenko has approved your booking request. "
             "Your seat is confirmed.", "catan"),
        note("p5", NotificationType.WAITLIST_PROMOTED, "Added to Waitlist",
             f"The table for {brass} is currently full. The organizer accepted your "
             "request: you will get the next free seat automatically.", "brass"),
        note("p2", NotificationType.REVIEW_REMINDER, "How was the game?",
             "Rate the organizer of Ticket to Ride Evening.", "ticket"),
    ]  # fmt: skip


async def seed_database(session: AsyncSession) -> dict[str, int]:
    if settings.is_production:
        raise RuntimeError("Seeding is disabled when ENVIRONMENT=production")

    now = datetime.now(UTC)
    users = await _create_users(session)
    events = await _create_events(session, users, now)
    await _create_reviews(session, users, events)
    for user_key, event_key in SEED_FAVORITES:
        session.add(Favorite(user_id=users[user_key].id, event_id=events[event_key].id))
    session.add_all(_notifications(users, events))
    await session.flush()
    return {"created_users": len(users), "created_events": len(events)}


async def _run(remove: bool) -> None:
    async with async_session_maker() as session, session.begin():
        if remove:
            removed = await remove_seed_data(session)
        else:
            summary = await seed_database(session)
    # Files are handled only once the transaction has committed.
    if remove:
        _cover_target().unlink(missing_ok=True)
        logger.info("Removed %d seed users and everything they owned.", removed)
        return
    _cover_target().parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(COVER_SOURCE, _cover_target())
    logger.info(
        "Seed complete: %d users, %d events.",
        summary["created_users"],
        summary["created_events"],
    )
    logger.info(SEED_GUIDE)


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    parser = argparse.ArgumentParser(
        description="Seed YupiBoard development test data."
    )
    parser.add_argument(
        "--remove",
        action="store_true",
        help="Delete all seeded records instead of adding them.",
    )
    args = parser.parse_args()
    if settings.is_production:
        logger.error("Refusing to run test data seeder in production environment.")
        sys.exit(1)
    try:
        asyncio.run(_run(remove=args.remove))
    except IntegrityError:
        logger.error("Seed data already exists; run `pnpm be seed:remove` first.")
        sys.exit(1)


if __name__ == "__main__":
    main()
