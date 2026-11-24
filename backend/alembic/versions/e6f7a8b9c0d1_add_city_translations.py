"""add city translations

Revision ID: e6f7a8b9c0d1
Revises: d4e5f6a7b8c9
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "e6f7a8b9c0d1"
down_revision: str | Sequence[str] | None = "d4e5f6a7b8c9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "city_translations",
        sa.Column("city_id", sa.Uuid(), nullable=False),
        sa.Column("language_code", sa.String(length=35), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.ForeignKeyConstraint(["city_id"], ["cities.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("city_id", "language_code"),
    )
    op.execute(
        """
        INSERT INTO city_translations (city_id, language_code, name)
        SELECT id, 'uk', CASE name
            WHEN 'Kyiv' THEN 'Київ'
            WHEN 'Lviv' THEN 'Львів'
            WHEN 'Odesa' THEN 'Одеса'
            WHEN 'Kharkiv' THEN 'Харків'
            WHEN 'Dnipro' THEN 'Дніпро'
            WHEN 'Zaporizhzhia' THEN 'Запоріжжя'
            WHEN 'Ivano-Frankivsk' THEN 'Івано-Франківськ'
            WHEN 'Vinnytsia' THEN 'Вінниця'
        END
        FROM cities
        WHERE country_id IN (SELECT id FROM countries WHERE code = 'UA')
          AND name IN (
              'Kyiv', 'Lviv', 'Odesa', 'Kharkiv', 'Dnipro',
              'Zaporizhzhia', 'Ivano-Frankivsk', 'Vinnytsia'
          )
        """
    )


def downgrade() -> None:
    op.drop_table("city_translations")
