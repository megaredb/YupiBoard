import argparse
import asyncio
import logging
import sys
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import async_session_maker
from app.core.security import get_password_hash
from app.modules.bookings.models import Booking, BookingStatus
from app.modules.events.models import Event, EventStatus
from app.modules.favorites.models import Favorite
from app.modules.moderation.models import AdminAuditLog, AuditActionType
from app.modules.notifications.enums import NotificationType
from app.modules.notifications.models import Notification
from app.modules.reviews.models import Review, ReviewTargetRole
from app.modules.users.enums import UserStatus
from app.modules.users.models import User

logger = logging.getLogger("yupiboard.seed")

SEED_PASSWORD = "Password123!"

SEED_USERS = [
    {
        "email": "admin@yupiboard.com",
        "first_name": "Admin",
        "last_name": "YupiBoard",
        "city": "Kyiv",
        "is_verified": True,
        "is_superuser": True,
        "bio": "Platform administrator and tabletop moderator.",
    },
    {
        "email": "organizer1@yupiboard.com",
        "first_name": "Olena",
        "last_name": "Kovalenko",
        "city": "Kyiv",
        "is_verified": True,
        "is_superuser": False,
        "bio": "Eurogames & Catan host in Kyiv.",
        "contact_info": "@olena_boardgames",
    },
    {
        "email": "organizer2@yupiboard.com",
        "first_name": "Taras",
        "last_name": "Shevchuk",
        "city": "Lviv",
        "is_verified": True,
        "is_superuser": False,
        "bio": "D&D and cooperative strategy organizer.",
        "contact_info": "@taras_dm",
    },
    {
        "email": "player1@yupiboard.com",
        "first_name": "Andrii",
        "last_name": "Melnyk",
        "city": "Kyiv",
        "is_verified": True,
        "is_superuser": False,
        "bio": "Always up for Dune: Imperium or Brass.",
    },
    {
        "email": "player2@yupiboard.com",
        "first_name": "Sofia",
        "last_name": "Bondar",
        "city": "Kyiv",
        "is_verified": True,
        "is_superuser": False,
        "bio": "Party games and deckbuilders fan.",
    },
    {
        "email": "player3@yupiboard.com",
        "first_name": "Dmytro",
        "last_name": "Tkachenko",
        "city": "Lviv",
        "is_verified": True,
        "is_superuser": False,
        "bio": "Sci-fi and RPG enthusiast.",
    },
    {
        "email": "unverified@yupiboard.com",
        "first_name": "New",
        "last_name": "Player",
        "city": "Odesa",
        "is_verified": False,
        "is_superuser": False,
        "bio": "Just joined YupiBoard.",
    },
]

SEED_USER_EMAILS = [u["email"] for u in SEED_USERS]


async def _reset_seed_data(session: AsyncSession) -> None:
    user_ids = list(
        (
            await session.scalars(
                select(User.id).where(User.email.in_(SEED_USER_EMAILS))
            )
        ).all()
    )
    if not user_ids:
        return

    event_ids = list(
        (
            await session.scalars(
                select(Event.id).where(Event.organizer_id.in_(user_ids))
            )
        ).all()
    )
    if event_ids:
        await session.execute(
            delete(AdminAuditLog).where(AdminAuditLog.target_id.in_(event_ids))
        )
        await session.execute(delete(Event).where(Event.id.in_(event_ids)))

    await session.execute(
        delete(AdminAuditLog).where(AdminAuditLog.admin_id.in_(user_ids))
    )
    await session.execute(delete(User).where(User.id.in_(user_ids)))
    await session.flush()


async def seed_database(
    session: AsyncSession, *, reset: bool = False
) -> dict[str, int]:
    """Populate idempotent development/QA data across all core modules."""
    if settings.is_production:
        raise RuntimeError("Seeding is disabled when ENVIRONMENT=production")

    if reset:
        await _reset_seed_data(session)

    users_by_email: dict[str, User] = {}
    created_users = 0
    pwd_hash = get_password_hash(SEED_PASSWORD)

    for spec in SEED_USERS:
        email = str(spec["email"])
        existing = await session.scalar(select(User).where(User.email == email))
        if existing is None:
            user = User(
                email=email,
                hashed_password=pwd_hash,
                first_name=spec["first_name"],
                last_name=spec["last_name"],
                city=spec["city"],
                is_verified=spec["is_verified"],
                is_superuser=spec["is_superuser"],
                bio=spec.get("bio"),
                contact_info=spec.get("contact_info"),
                status=UserStatus.ACTIVE,
                is_deleted=False,
            )
            session.add(user)
            await session.flush()
            users_by_email[email] = user
            created_users += 1
        else:
            users_by_email[email] = existing

    admin = users_by_email["admin@yupiboard.com"]
    org1 = users_by_email["organizer1@yupiboard.com"]
    org2 = users_by_email["organizer2@yupiboard.com"]
    p1 = users_by_email["player1@yupiboard.com"]
    p2 = users_by_email["player2@yupiboard.com"]
    p3 = users_by_email["player3@yupiboard.com"]

    now = datetime.now(UTC)
    event_specs: list[dict[str, Any]] = [
        {
            "title": "[Seed] Dune: Imperium Championship",
            "description": "Competitive 4-player Dune: Imperium session with Rise of Ix expansion.",
            "game_title": "Dune: Imperium",
            "location_name": "Geekach Club",
            "address": "Sumska St, 10",
            "city": "Kharkiv",
            "lat": 49.9947,
            "lon": 36.2338,
            "start_datetime": now + timedelta(days=2, hours=2),
            "end_datetime": now + timedelta(days=2, hours=6),
            "min_players": 2,
            "max_players": 4,
            "current_confirmed": 1,
            "entry_cost": Decimal("150.00"),
            "status": EventStatus.PUBLISHED,
            "is_verified": True,
            "promoted_to_datetime": now + timedelta(days=1),
            "organizer": org1,
        },
        {
            "title": "[Seed] Brass: Birmingham Full Table",
            "description": "Heavy industrial strategy night — table is full, waitlist open!",
            "game_title": "Brass: Birmingham",
            "location_name": "CBGames Hub",
            "address": "Pushkinska St, 32",
            "city": "Kharkiv",
            "lat": 49.9973,
            "lon": 36.2414,
            "start_datetime": now + timedelta(days=3),
            "end_datetime": now + timedelta(days=3, hours=4),
            "min_players": 2,
            "max_players": 2,
            "current_confirmed": 2,
            "entry_cost": Decimal("100.00"),
            "status": EventStatus.PUBLISHED,
            "is_verified": True,
            "promoted_to_datetime": None,
            "organizer": org1,
        },
        {
            "title": "[Seed] Root: Woodland Alliance (Pending Moderation)",
            "description": "Asymmetric woodland strategy evening for newcomers and veterans.",
            "game_title": "Root",
            "location_name": "Kharkiv Meeple Lounge",
            "address": "Svobody Square, 5",
            "city": "Kharkiv",
            "lat": 50.006,
            "lon": 36.2313,
            "start_datetime": now + timedelta(days=5),
            "end_datetime": now + timedelta(days=5, hours=4),
            "min_players": 2,
            "max_players": 4,
            "current_confirmed": 0,
            "entry_cost": Decimal("0.00"),
            "status": EventStatus.ON_MODERATION,
            "is_verified": False,
            "promoted_to_datetime": None,
            "organizer": org2,
        },
        {
            "title": "[Seed] Gloomhaven: Jaws of the Lion (Pending Moderation)",
            "description": "Tactical campaign scenario 1 & 2.",
            "game_title": "Gloomhaven",
            "location_name": "Portal Cafe",
            "address": "Nauky Ave, 27",
            "city": "Kharkiv",
            "lat": 50.013,
            "lon": 36.2275,
            "start_datetime": now + timedelta(days=6),
            "end_datetime": now + timedelta(days=6, hours=5),
            "min_players": 2,
            "max_players": 4,
            "current_confirmed": 0,
            "entry_cost": Decimal("50.00"),
            "status": EventStatus.ON_MODERATION,
            "is_verified": False,
            "promoted_to_datetime": None,
            "organizer": org1,
        },
        {
            "title": "[Seed] Unclear Venue Session (Rejected)",
            "description": "Board game meetup.",
            "game_title": "Catan",
            "location_name": None,
            "address": "TBD",
            "city": "Kharkiv",
            "lat": 49.9935,
            "lon": 36.2304,
            "start_datetime": now + timedelta(days=4),
            "end_datetime": now + timedelta(days=4, hours=3),
            "min_players": 2,
            "max_players": 4,
            "current_confirmed": 0,
            "entry_cost": Decimal("0.00"),
            "status": EventStatus.REJECTED,
            "rejection_reason": "Please provide a specific venue address instead of TBD.",
            "is_verified": False,
            "promoted_to_datetime": None,
            "organizer": org2,
        },
        {
            "title": "[Seed] Terraforming Mars Live Session",
            "description": "Ongoing session currently in progress.",
            "game_title": "Terraforming Mars",
            "location_name": "Saltivka Games",
            "address": "Heroiv Pratsi St, 7",
            "city": "Kharkiv",
            "lat": 50.027,
            "lon": 36.333,
            "start_datetime": now - timedelta(hours=1),
            "end_datetime": now + timedelta(hours=3),
            "min_players": 2,
            "max_players": 5,
            "current_confirmed": 2,
            "entry_cost": Decimal("80.00"),
            "status": EventStatus.ONGOING,
            "is_verified": True,
            "promoted_to_datetime": None,
            "organizer": org1,
        },
        {
            "title": "[Seed] Catan Classic Evening (Completed)",
            "description": "Recently completed session open for attendance & reviews.",
            "game_title": "Catan",
            "location_name": "Geekach Club",
            "address": "Sumska St, 10",
            "city": "Kharkiv",
            "lat": 49.9947,
            "lon": 36.2338,
            "start_datetime": now - timedelta(hours=6),
            "end_datetime": now - timedelta(hours=2),
            "min_players": 2,
            "max_players": 4,
            "current_confirmed": 2,
            "entry_cost": Decimal("0.00"),
            "status": EventStatus.COMPLETED,
            "is_verified": True,
            "promoted_to_datetime": None,
            "organizer": org1,
        },
        {
            "title": "[Seed] Scythe Tournament (Cancelled)",
            "description": "Cancelled due to venue maintenance.",
            "game_title": "Scythe",
            "location_name": "Kharkiv Meeple Lounge",
            "address": "Svobody Square, 5",
            "city": "Kharkiv",
            "lat": 50.006,
            "lon": 36.2313,
            "start_datetime": now + timedelta(days=7),
            "end_datetime": now + timedelta(days=7, hours=4),
            "min_players": 2,
            "max_players": 5,
            "current_confirmed": 0,
            "entry_cost": Decimal("120.00"),
            "status": EventStatus.CANCELLED,
            "is_verified": True,
            "promoted_to_datetime": None,
            "organizer": org2,
        },
    ]

    events_by_title: dict[str, Event] = {}
    created_events = 0
    for spec in event_specs:
        title = str(spec["title"])
        organizer = spec["organizer"]
        assert isinstance(organizer, User)
        existing_ev = await session.scalar(
            select(Event).where(
                Event.title == title, Event.organizer_id == organizer.id
            )
        )
        if existing_ev is None:
            ev = Event(
                organizer_id=organizer.id,
                title=title,
                description=spec["description"],
                game_title=spec["game_title"],
                location_name=spec["location_name"],
                address=spec["address"],
                city=spec["city"],
                lat=spec["lat"],
                lon=spec["lon"],
                start_datetime=spec["start_datetime"],
                end_datetime=spec["end_datetime"],
                min_players=spec["min_players"],
                max_players=spec["max_players"],
                current_confirmed=spec["current_confirmed"],
                entry_cost=spec["entry_cost"],
                status=spec["status"],
                rejection_reason=spec.get("rejection_reason"),
                is_verified=spec["is_verified"],
                promoted_to_datetime=spec["promoted_to_datetime"],
                is_deleted=False,
            )
            session.add(ev)
            await session.flush()
            events_by_title[title] = ev
            created_events += 1
        else:
            events_by_title[title] = existing_ev

    dune = events_by_title["[Seed] Dune: Imperium Championship"]
    brass = events_by_title["[Seed] Brass: Birmingham Full Table"]
    rejected_ev = events_by_title["[Seed] Unclear Venue Session (Rejected)"]
    ongoing_ev = events_by_title["[Seed] Terraforming Mars Live Session"]
    completed_ev = events_by_title["[Seed] Catan Classic Evening (Completed)"]

    booking_specs = [
        (dune.id, p1.id, BookingStatus.CONFIRMED),
        (dune.id, p2.id, BookingStatus.PENDING),
        (brass.id, p1.id, BookingStatus.CONFIRMED),
        (brass.id, p2.id, BookingStatus.CONFIRMED),
        (brass.id, p3.id, BookingStatus.WAITLIST),
        (ongoing_ev.id, p1.id, BookingStatus.CONFIRMED),
        (ongoing_ev.id, p2.id, BookingStatus.ATTENDED),
        (completed_ev.id, p1.id, BookingStatus.ATTENDED),
        (completed_ev.id, p2.id, BookingStatus.ATTENDED),
        (completed_ev.id, p3.id, BookingStatus.NO_SHOW),
    ]
    for ev_id, u_id, b_status in booking_specs:
        existing_b = await session.scalar(
            select(Booking).where(Booking.event_id == ev_id, Booking.user_id == u_id)
        )
        if existing_b is None:
            session.add(Booking(event_id=ev_id, user_id=u_id, status=b_status))

    existing_fav = await session.get(Favorite, (p1.id, dune.id))
    if existing_fav is None:
        session.add(Favorite(user_id=p1.id, event_id=dune.id))

    existing_rev = await session.scalar(
        select(Review).where(
            Review.event_id == completed_ev.id,
            Review.reviewer_id == p1.id,
            Review.reviewee_id == org1.id,
        )
    )
    if existing_rev is None:
        session.add(
            Review(
                event_id=completed_ev.id,
                reviewer_id=p1.id,
                reviewee_id=org1.id,
                target_role=ReviewTargetRole.ORGANIZER,
                score=5,
            )
        )
        org1.rating_as_organizer = Decimal("5.00")
        org1.rating_as_organizer_count = 1
        session.add(org1)

    existing_audit = await session.scalar(
        select(AdminAuditLog).where(
            AdminAuditLog.target_entity == "Event",
            AdminAuditLog.target_id == rejected_ev.id,
        )
    )
    if existing_audit is None:
        session.add(
            AdminAuditLog(
                admin_id=admin.id,
                action_type=AuditActionType.EVENT_REJECTED,
                target_entity="Event",
                target_id=rejected_ev.id,
                justification_reason=rejected_ev.rejection_reason,
            )
        )

    existing_notif = await session.scalar(
        select(Notification).where(Notification.user_id == p1.id)
    )
    if existing_notif is None:
        session.add_all(
            [
                Notification(
                    user_id=p1.id,
                    notification_type=NotificationType.BOOKING_APPROVED,
                    title="Application Approved",
                    message=f"Great news! Your seat at {dune.title} is confirmed.",
                    metadata_payload={"event_id": str(dune.id)},
                ),
                Notification(
                    user_id=org1.id,
                    notification_type=NotificationType.BOOKING_REQUESTED,
                    title="New Booking Request",
                    message=f"Sofia Bondar requested a seat at {dune.title}.",
                    metadata_payload={"event_id": str(dune.id)},
                ),
            ]
        )

    await session.flush()
    return {
        "created_users": created_users,
        "created_events": created_events,
    }


async def _run(reset: bool) -> None:
    async with async_session_maker() as session, session.begin():
        summary = await seed_database(session, reset=reset)
    logger.info(
        "Seed complete: %d new users, %d new events (dev password: %s)",
        summary["created_users"],
        summary["created_events"],
        SEED_PASSWORD,
    )


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    parser = argparse.ArgumentParser(
        description="Seed YupiBoard development test data."
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete existing seeded records before re-creating them.",
    )
    args = parser.parse_args()
    if settings.is_production:
        logger.error("Refusing to run test data seeder in production environment.")
        sys.exit(1)
    asyncio.run(_run(reset=args.reset))


if __name__ == "__main__":
    main()
