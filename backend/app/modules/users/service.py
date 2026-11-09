import uuid
from collections.abc import Sequence

from app.core.exceptions import BadRequestException, NotFoundException
from app.core.security import get_password_hash, verify_password
from app.modules.auth.repository import RefreshTokenRepository
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserUpdate


class UserService:
    def __init__(
        self,
        user_repo: UserRepository,
        token_repo: RefreshTokenRepository | None = None,
    ) -> None:
        self.user_repo = user_repo
        self.token_repo = token_repo

    async def get_by_id(self, user_id: uuid.UUID) -> User:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        return user

    async def list_users(self, skip: int = 0, limit: int = 100) -> Sequence[User]:
        return await self.user_repo.get_all(skip=skip, limit=limit)

    async def update_profile(self, user: User, data: UserUpdate) -> User:
        update_data = data.model_dump(exclude_unset=True)
        # exclude_none=False: an explicit null in the request clears the field
        return await self.user_repo.update(user, exclude_none=False, **update_data)

    async def change_password(
        self, user: User, new_password: str, old_password: str | None = None
    ) -> User:
        if user.hashed_password is not None:
            if not old_password:
                raise BadRequestException("Current password is required")
            try:
                is_valid = verify_password(old_password, user.hashed_password)
            except Exception:  # noqa: BLE001
                is_valid = False
            if not is_valid:
                raise BadRequestException("Invalid old password")

        hashed_password = get_password_hash(new_password)
        updated_user = await self.user_repo.update(
            user, hashed_password=hashed_password
        )
        if self.token_repo:
            await self.token_repo.revoke_all_for_user(user.id)
        return updated_user

    async def delete(self, user: User) -> None:
        await self.user_repo.soft_delete(user)
