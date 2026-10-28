"""Use PostGIS geography for event locations."""

from collections.abc import Sequence

import sqlalchemy as sa
from geoalchemy2 import Geography

from alembic import op

revision: str = "9c4f2b71e6aa"
down_revision: str | Sequence[str] | None = "81f2ca0b43d1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    op.add_column(
        "events",
        sa.Column(
            "location",
            Geography(geometry_type="POINT", srid=4326, spatial_index=False),
            nullable=True,
        ),
    )
    op.execute(
        """
        UPDATE events
        SET location = ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
        """
    )
    op.alter_column("events", "location", nullable=False)
    op.drop_constraint("ck_events_lat_range", "events", type_="check")
    op.drop_column("events", "lat")
    op.drop_column("events", "lon")
    op.create_index(
        "ix_events_location",
        "events",
        ["location"],
        unique=False,
        postgresql_using="gist",
    )


def downgrade() -> None:
    op.drop_index("ix_events_location", table_name="events")
    op.add_column("events", sa.Column("lat", sa.Float(), nullable=True))
    op.add_column("events", sa.Column("lon", sa.Float(), nullable=True))
    op.execute(
        """
        UPDATE events
        SET lat = ST_Y(location::geometry), lon = ST_X(location::geometry)
        """
    )
    op.alter_column("events", "lat", nullable=False)
    op.alter_column("events", "lon", nullable=False)
    op.drop_column("events", "location")
    op.create_check_constraint(
        "ck_events_lat_range",
        "events",
        "lat >= -90 AND lat <= 90",
    )
