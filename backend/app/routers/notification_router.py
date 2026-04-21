from dependencies.auth import AuthenticatedUser, get_current_user
from dependencies.tenant import get_tenant_id
from fastapi import APIRouter, Depends, HTTPException
from schemas.notification import NotificationListResponse, NotificationResponse
from services.notification_service import (
    is_effectively_read,
    list_notifications,
    mark_all_read,
    mark_read,
)
from services.player_service import get_player_by_cognito_sub

router = APIRouter(
    prefix="/api/v1/notifications",
    tags=["notifications"],
)


@router.get("", response_model=NotificationListResponse)
async def read_notifications(
    user: AuthenticatedUser = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> NotificationListResponse:
    """List recent notifications for the current user + unread count."""
    player = get_player_by_cognito_sub(tenant_id, user.sub)
    if not player:
        raise HTTPException(status_code=400, detail="Player not registered")

    notifications, read_until = list_notifications(tenant_id, player.player_id)

    items: list[NotificationResponse] = []
    unread_count = 0
    for n in notifications:
        effective_read = is_effectively_read(n, read_until)
        if not effective_read:
            unread_count += 1
        items.append(
            NotificationResponse(
                notif_id=n.notif_id,
                type=n.type,
                payload=n.payload,
                read=effective_read,
                created_at=n.created_at.isoformat(),
            )
        )

    return NotificationListResponse(notifications=items, unread_count=unread_count)


@router.post("/{notif_id}/read", status_code=204)
async def mark_notification_read(
    notif_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> None:
    """Mark a single notification as read."""
    player = get_player_by_cognito_sub(tenant_id, user.sub)
    if not player:
        raise HTTPException(status_code=400, detail="Player not registered")

    updated = mark_read(tenant_id, player.player_id, notif_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Notification not found")


@router.post("/read-all", status_code=204)
async def mark_all_notifications_read(
    user: AuthenticatedUser = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> None:
    """Mark every notification as read via the player-level overlay timestamp."""
    player = get_player_by_cognito_sub(tenant_id, user.sub)
    if not player:
        raise HTTPException(status_code=400, detail="Player not registered")

    mark_all_read(tenant_id, player.player_id)
