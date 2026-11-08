from pydantic import BaseModel, Field


class MessageResponse(BaseModel):
    message: str
    detail: str | None = None


class Page[T](BaseModel):
    items: list[T]
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    total_pages: int = Field(ge=1)


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)
