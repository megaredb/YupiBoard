"""create locations tables and event location_name

Revision ID: b8c9d0e1f2a3
Revises: 7a1b2c3d4e5f
"""

import uuid
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "b8c9d0e1f2a3"
down_revision: str | Sequence[str] | None = "7a1b2c3d4e5f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Add location_name to events
    op.add_column(
        "events", sa.Column("location_name", sa.String(length=150), nullable=True)
    )

    # 2. Create countries table
    countries_table = op.create_table(
        "countries",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("code", sa.String(length=2), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index(op.f("ix_countries_code"), "countries", ["code"], unique=True)
    op.create_index(op.f("ix_countries_id"), "countries", ["id"], unique=False)

    # 3. Create cities table
    cities_table = op.create_table(
        "cities",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("country_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lon", sa.Float(), nullable=False),
        sa.Column(
            "is_active",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["country_id"], ["countries.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_cities_country_id"), "cities", ["country_id"], unique=False
    )
    op.create_index(op.f("ix_cities_id"), "cities", ["id"], unique=False)
    op.create_index(op.f("ix_cities_name"), "cities", ["name"], unique=False)

    # 4. Seed initial countries and reference cities
    ua_id = uuid.uuid4()
    pl_id = uuid.uuid4()
    de_id = uuid.uuid4()

    op.bulk_insert(
        countries_table,
        [
            {"id": ua_id, "code": "UA", "name": "Ukraine"},
            {"id": pl_id, "code": "PL", "name": "Poland"},
            {"id": de_id, "code": "DE", "name": "Germany"},
        ],
    )

    cities_seed = [
        {
            "id": uuid.uuid4(),
            "country_id": ua_id,
            "name": "Kyiv",
            "lat": 50.4501,
            "lon": 30.5234,
            "is_active": True,
        },
        {
            "id": uuid.uuid4(),
            "country_id": ua_id,
            "name": "Lviv",
            "lat": 49.8397,
            "lon": 24.0297,
            "is_active": True,
        },
        {
            "id": uuid.uuid4(),
            "country_id": ua_id,
            "name": "Odesa",
            "lat": 46.4825,
            "lon": 30.7233,
            "is_active": True,
        },
        {
            "id": uuid.uuid4(),
            "country_id": ua_id,
            "name": "Kharkiv",
            "lat": 49.9935,
            "lon": 36.2304,
            "is_active": True,
        },
        {
            "id": uuid.uuid4(),
            "country_id": ua_id,
            "name": "Dnipro",
            "lat": 48.4647,
            "lon": 35.0462,
            "is_active": True,
        },
        {
            "id": uuid.uuid4(),
            "country_id": ua_id,
            "name": "Zaporizhzhia",
            "lat": 47.8388,
            "lon": 35.1396,
            "is_active": True,
        },
        {
            "id": uuid.uuid4(),
            "country_id": ua_id,
            "name": "Ivano-Frankivsk",
            "lat": 48.9226,
            "lon": 24.7111,
            "is_active": True,
        },
        {
            "id": uuid.uuid4(),
            "country_id": ua_id,
            "name": "Vinnytsia",
            "lat": 49.2331,
            "lon": 28.4682,
            "is_active": True,
        },
        {
            "id": uuid.uuid4(),
            "country_id": pl_id,
            "name": "Warsaw",
            "lat": 52.2297,
            "lon": 21.0122,
            "is_active": True,
        },
        {
            "id": uuid.uuid4(),
            "country_id": pl_id,
            "name": "Krakow",
            "lat": 50.0647,
            "lon": 19.9450,
            "is_active": True,
        },
        {
            "id": uuid.uuid4(),
            "country_id": pl_id,
            "name": "Wroclaw",
            "lat": 51.1079,
            "lon": 17.0385,
            "is_active": True,
        },
        {
            "id": uuid.uuid4(),
            "country_id": de_id,
            "name": "Berlin",
            "lat": 52.5200,
            "lon": 13.4050,
            "is_active": True,
        },
        {
            "id": uuid.uuid4(),
            "country_id": de_id,
            "name": "Munich",
            "lat": 48.1351,
            "lon": 11.5820,
            "is_active": True,
        },
    ]
    op.bulk_insert(cities_table, cities_seed)


def downgrade() -> None:
    op.drop_table("cities")
    op.drop_table("countries")
    op.drop_column("events", "location_name")
