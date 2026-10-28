import uuid
from collections.abc import Sequence

from app.core.exceptions import NotFoundException
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserUpdate


class UserService:
    def __init__(self, user_repo: UserRepository) -> None:
        self.user_repo = user_repo

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

    async def delete(self, user: User) -> None:
        await self.user_repo.soft_delete(user)
