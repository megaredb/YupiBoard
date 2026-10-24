from sqlalchemy import Float
from sqlalchemy.types import TypeDecorator


class Longitude(TypeDecorator[float]):
    impl = Float
    cache_ok = True

    def process_bind_param(self, value: float | None, dialect: object) -> float | None:
        if value is not None and not -180 <= value <= 180:
            raise ValueError("Longitude must be between -180 and 180")
        return value
