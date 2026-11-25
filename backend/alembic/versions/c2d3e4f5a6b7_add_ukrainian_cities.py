"""add Ukrainian regional centers and major cities

Revision ID: c2d3e4f5a6b7
Revises: a1b2c3d4e5f6
"""

import uuid
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "c2d3e4f5a6b7"
down_revision: str | Sequence[str] | None = "a1b2c3d4e5f6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# (canonical_en_name, uk_name, lat, lon)
UKRAINIAN_CITIES: tuple[tuple[str, str, float, float], ...] = (
    # Remaining regional centers
    ("Poltava", "Полтава", 49.5883, 34.5514),
    ("Chernihiv", "Чернігів", 51.4982, 31.2893),
    ("Cherkasy", "Черкаси", 49.4444, 32.0598),
    ("Zhytomyr", "Житомир", 50.2547, 28.6587),
    ("Sumy", "Суми", 50.9077, 34.7981),
    ("Khmelnytskyi", "Хмельницький", 49.4230, 26.9871),
    ("Chernivtsi", "Чернівці", 48.2921, 25.9358),
    ("Rivne", "Рівне", 50.6199, 26.2516),
    ("Ternopil", "Тернопіль", 49.5535, 25.5948),
    ("Lutsk", "Луцьк", 50.7472, 25.3254),
    ("Uzhhorod", "Ужгород", 48.6208, 22.2879),
    ("Kropyvnytskyi", "Кропивницький", 48.5079, 32.2623),
    ("Mykolaiv", "Миколаїв", 46.9750, 31.9946),
    ("Kherson", "Херсон", 46.6354, 32.6169),
    ("Donetsk", "Донецьк", 48.0159, 37.8029),
    ("Luhansk", "Луганськ", 48.5740, 39.3078),
    ("Simferopol", "Сімферополь", 44.9521, 34.1024),
    # Major Ukrainian cities
    ("Kryvyi Rih", "Кривий Ріг", 47.9105, 33.3918),
    ("Bila Tserkva", "Біла Церква", 49.7968, 30.1311),
    ("Kremenchuk", "Кременчук", 49.0658, 33.4100),
    ("Kamianske", "Кам'янське", 48.5113, 34.6021),
    ("Brovary", "Бровари", 50.5111, 30.7900),
    ("Irpin", "Ірпінь", 50.5218, 30.2506),
    ("Mukachevo", "Мукачево", 48.4414, 22.7178),
    ("Drohobych", "Дрогобич", 49.3500, 23.5056),
    ("Kamianets-Podilskyi", "Кам'янець-Подільський", 48.6833, 26.5833),
)


def upgrade() -> None:
    conn = op.get_bind()
    ua_id = conn.execute(
        sa.text("SELECT id FROM countries WHERE code = 'UA' LIMIT 1")
    ).scalar_one_or_none()
    if ua_id is None:
        return

    for en_name, uk_name, lat, lon in UKRAINIAN_CITIES:
        existing_id = conn.execute(
            sa.text(
                "SELECT id FROM cities WHERE country_id = :country_id AND name = :name LIMIT 1"
            ),
            {"country_id": ua_id, "name": en_name},
        ).scalar_one_or_none()

        city_id = existing_id or uuid.uuid4()
        if existing_id is None:
            conn.execute(
                sa.text(
                    "INSERT INTO cities (id, country_id, name, lat, lon, is_active) "
                    "VALUES (:id, :country_id, :name, :lat, :lon, true)"
                ),
                {
                    "id": city_id,
                    "country_id": ua_id,
                    "name": en_name,
                    "lat": lat,
                    "lon": lon,
                },
            )

        conn.execute(
            sa.text(
                "INSERT INTO city_translations (city_id, language_code, name) "
                "VALUES (:city_id, 'uk', :uk_name) "
                "ON CONFLICT (city_id, language_code) DO NOTHING"
            ),
            {"city_id": city_id, "uk_name": uk_name},
        )


def downgrade() -> None:
    conn = op.get_bind()
    names = [en_name for en_name, *_ in UKRAINIAN_CITIES]
    conn.execute(
        sa.text(
            "DELETE FROM cities "
            "WHERE country_id IN (SELECT id FROM countries WHERE code = 'UA') "
            "AND name = ANY(:names)"
        ),
        {"names": names},
    )
