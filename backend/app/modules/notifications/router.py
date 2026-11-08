import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.modules.auth.dependencies import get_current_user
from app.modules.notifications.dependencies import get_notification_service
from app.modules.notifications.schemas import (
    DeletedCountResponse,
    MarkAllReadResponse,
    NotificationCountsRead,
    NotificationFilterParams,
    NotificationIdsRequest,
    NotificationMetadataFilter,
    NotificationPage,
    NotificationRead,
    UnreadCountResponse,
)
from app.modules.notifications.service import NotificationService
from app.modules.users.models import User

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get(
    "",
    response_model=NotificationPage,
    summary="List the current user's notifications, newest first",
)
async def list_notifications(
    filters: Annotated[NotificationFilterParams, Query()],
    current_user: Annotated[User, Depends(get_current_user)],
    notification_service: Annotated[
        NotificationService, Depends(get_notification_service)
    ],
) -> NotificationPage:
    items, total, total_pages = await notification_service.list_for_user(
        current_user.id, filters
    )
    return NotificationPage(
        items=[NotificationRead.model_validate(n) for n in items],
        total=total,
        page=filters.page,
        total_pages=total_pages,
    )


@router.get(
    "/counts",
    response_model=NotificationCountsRead,
    summary="Total and unread counters per notification tab",
)
async def get_notification_counts(
    current_user: Annotated[User, Depends(get_current_user)],
    notification_service: Annotated[
        NotificationService, Depends(get_notification_service)
    ],
) -> NotificationCountsRead:
    return await notification_service.get_counts(current_user.id)


@router.get(
    "/unread-count",
    response_model=UnreadCountResponse,
    summary="Number of unread notifications (bell badge)",
)
async def get_unread_count(
    current_user: Annotated[User, Depends(get_current_user)],
    notification_service: Annotated[
        NotificationService, Depends(get_notification_service)
    ],
) -> UnreadCountResponse:
    unread = await notification_service.get_unread_count(current_user.id)
    return UnreadCountResponse(unread=unread)


@router.post(
    "/read",
    response_model=MarkAllReadResponse,
    summary="Mark the given notifications as read",
)
async def mark_notifications_read(
    data: NotificationIdsRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    notification_service: Annotated[
        NotificationService, Depends(get_notification_service)
    ],
) -> MarkAllReadResponse:
    updated = await notification_service.mark_many_as_read(data.ids, current_user.id)
    return MarkAllReadResponse(updated=updated)


@router.post(
    "/read-by-metadata",
    response_model=MarkAllReadResponse,
    summary="Mark notifications linked to an entity as read (e.g. booking_id)",
)
async def mark_notifications_read_by_metadata(
    data: NotificationMetadataFilter,
    current_user: Annotated[User, Depends(get_current_user)],
    notification_service: Annotated[
        NotificationService, Depends(get_notification_service)
    ],
) -> MarkAllReadResponse:
    updated = await notification_service.mark_as_read_by_metadata(
        current_user.id, data.key, data.value
    )
    return MarkAllReadResponse(updated=updated)


@router.post(
    "/read-all",
    response_model=MarkAllReadResponse,
    summary="Mark all of the current user's notifications as read",
)
async def mark_all_notifications_read(
    current_user: Annotated[User, Depends(get_current_user)],
    notification_service: Annotated[
        NotificationService, Depends(get_notification_service)
    ],
) -> MarkAllReadResponse:
    updated = await notification_service.mark_all_as_read(current_user.id)
    return MarkAllReadResponse(updated=updated)


@router.post(
    "/{notification_id}/read",
    response_model=NotificationRead,
    summary="Mark a single notification as read",
)
async def mark_notification_read(
    notification_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    notification_service: Annotated[
        NotificationService, Depends(get_notification_service)
    ],
) -> NotificationRead:
    notification = await notification_service.mark_as_read(
        notification_id, current_user.id
    )
    return NotificationRead.model_validate(notification)


@router.post(
    "/{notification_id}/unread",
    response_model=NotificationRead,
    summary="Mark a single notification as unread",
)
async def mark_notification_unread(
    notification_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    notification_service: Annotated[
        NotificationService, Depends(get_notification_service)
    ],
) -> NotificationRead:
    notification = await notification_service.mark_as_unread(
        notification_id, current_user.id
    )
    return NotificationRead.model_validate(notification)


@router.delete(
    "",
    response_model=DeletedCountResponse,
    summary="Delete all (or only read) notifications of the current user",
)
async def delete_notifications(
    current_user: Annotated[User, Depends(get_current_user)],
    notification_service: Annotated[
        NotificationService, Depends(get_notification_service)
    ],
    only_read: Annotated[
        bool, Query(description="Delete only already read notifications")
    ] = False,
) -> DeletedCountResponse:
    deleted = await notification_service.delete_all(
        current_user.id, only_read=only_read
    )
    return DeletedCountResponse(deleted=deleted)


@router.delete(
    "/{notification_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a single notification",
)
async def delete_notification(
    notification_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    notification_service: Annotated[
        NotificationService, Depends(get_notification_service)
    ],
) -> None:
    await notification_service.delete(notification_id, current_user.id)
