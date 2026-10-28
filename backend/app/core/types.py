import uuid
from typing import Annotated

from pydantic import AfterValidator


def validate_uuid7(v: uuid.UUID) -> uuid.UUID:
    if v.version != 7:
        raise ValueError(f"UUID must be version 7, got version {v.version}")
    return v


UUID7 = Annotated[uuid.UUID, AfterValidator(validate_uuid7)]
