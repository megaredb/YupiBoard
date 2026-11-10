from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.repositories import BaseRepository
from app.modules.locations.models import City, Country


class CountryRepository(BaseRepository[Country]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Country, session)

    async def list_all(self) -> Sequence[Country]:
        stmt = select(Country).order_by(Country.name.asc())
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def list_with_cities(self) -> Sequence[Country]:
        stmt = (
            select(Country)
            .options(joinedload(Country.cities))
            .order_by(Country.name.asc())
        )
        result = await self.session.execute(stmt)
        return result.unique().scalars().all()

    async def get_by_code(self, code: str) -> Country | None:
        stmt = select(Country).where(Country.code == code.upper().strip())
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()


class CityRepository(BaseRepository[City]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(City, session)

    async def search(
        self,
        query: str | None = None,
        country_code: str | None = None,
        limit: int = 20,
    ) -> Sequence[City]:
        stmt = (
            select(City)
            .options(joinedload(City.country))
            .where(City.is_active.is_(True))
        )

        if country_code:
            stmt = stmt.join(City.country).where(
                Country.code == country_code.upper().strip()
            )

        if query:
            clean_query = query.strip()
            stmt = stmt.where(City.name.ilike(f"%{clean_query}%"))

        stmt = stmt.order_by(City.name.asc()).limit(limit)
        result = await self.session.execute(stmt)
        return result.scalars().all()
