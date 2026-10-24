import uuid
from collections.abc import Sequence

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    NotFoundException,
)
from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.repositories.token import RefreshTokenRepository
from app.repositories.user import UserRepository
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    def __init__(
        self, user_repo: UserRepository, token_repo: RefreshTokenRepository
    ) -> None:
        self.user_repo = user_repo
        self.token_repo = token_repo

    async def create(self, data: UserCreate) -> User:
        email = data.email.strip().lower()
        # include soft-deleted accounts: their email stays reserved in the DB
        if await self.user_repo.get_by_email(email, include_deleted=True):
            raise ConflictException("User with this email is already registered")
        return await self.user_repo.create(
            email=email,
            hashed_password=get_password_hash(data.password),
            full_name=data.full_name,
        )

    async def get_by_id(self, user_id: uuid.UUID) -> User:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        return user

    async def get_by_email(self, email: str) -> User:
        user = await self.user_repo.get_by_email(email)
        if not user:
            raise NotFoundException("User not found")
        return user

    async def list_users(self, skip: int = 0, limit: int = 100) -> Sequence[User]:
        return await self.user_repo.get_all(skip=skip, limit=limit)

    async def update_profile(self, user: User, data: UserUpdate) -> User:
        update_data = data.model_dump(exclude_unset=True)
        return await self.user_repo.update(user, exclude_none=False, **update_data)

    async def change_password(
        self, user: User, current_password: str, new_password: str
    ) -> None:
        if not user.hashed_password:
            # Google-only account: there is no password to confirm against
            raise BadRequestException(
                "Password is not set for this account, use password recovery"
            )
        if not verify_password(current_password, user.hashed_password):
            raise BadRequestException("Current password is incorrect")

        await self.user_repo.update(
            user, hashed_password=get_password_hash(new_password)
        )
        # sign out every session, the same way password reset does
        await self.token_repo.revoke_all_for_user(user.id)

    async def delete(self, user: User) -> None:
        await self.user_repo.soft_delete(user)
        await self.token_repo.revoke_all_for_user(user.id)
