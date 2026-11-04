import pytest
from pydantic import ValidationError

from app.modules.users.schemas import UserUpdate


def test_user_update_accepts_bio() -> None:
    update = UserUpdate(bio="A short introduction")

    assert update.bio == "A short introduction"


def test_user_update_rejects_long_bio() -> None:
    with pytest.raises(ValidationError):
        UserUpdate(bio="x" * 1001)
