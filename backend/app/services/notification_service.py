"""Notification service - in-app user notifications.

Storage: single-table DynamoDB.
    PK: TENANT#<tenant_id>
    SK: NOTIF#<recipient_id>#<timestamp>#<short_uuid>

The last two SK segments together form the public `notif_id`, so a single-item
read can be performed with just recipient_id + notif_id.

Read-state: two overlapping mechanisms.
    1. Per-notification `read` flag updated by POST /notifications/{id}/read.
    2. Player-level `notifications_read_until` timestamp set by mark-all-read —
       any notification with `created_at <= read_until` is considered read
       without requiring per-item writes.
"""

import uuid
from datetime import UTC, datetime, timedelta

from libs.commons.logging import logger
from models.base import BaseEntity
from models.notification import NotificationModel, NotificationType
from models.player import PlayerModel

TTL_DAYS_UNREAD = 30
TTL_DAYS_READ = 1  # once read, notifications expire quickly so the drawer stays lean


def _build_notif_id(now: datetime) -> str:
    """Build a URL-safe notif_id that is also chronologically sortable.

    Format: `<epoch_ms>-<uuid8>`. Leading epoch-ms means SK lexical order
    matches chronological order; no `#` or `:` so the id can be used
    directly as a URL path parameter.
    """
    epoch_ms = int(now.timestamp() * 1000)
    return f"{epoch_ms}-{uuid.uuid4().hex[:8]}"


def _sk(recipient_id: str, notif_id: str) -> str:
    return f"NOTIF#{recipient_id}#{notif_id}"


def create_notification(
    tenant_id: str,
    recipient_id: str,
    type: NotificationType,
    payload: dict,
) -> NotificationModel:
    """Create a single notification for a recipient."""
    now = datetime.now(UTC)
    notif_id = _build_notif_id(now)
    expires_at = int((now + timedelta(days=TTL_DAYS_UNREAD)).timestamp())

    notification = NotificationModel(
        pk=f"TENANT#{tenant_id}",
        sk=_sk(recipient_id, notif_id),
        notif_id=notif_id,
        recipient_id=recipient_id,
        type=type,
        payload=payload,
        read=False,
        expires_at=expires_at,
        created_at=now,
        updated_at=now,
    )
    notification.save()
    return notification


def create_notifications_bulk(
    tenant_id: str,
    recipient_ids: list[str],
    type: NotificationType,
    payload: dict,
) -> None:
    """Fan-out: create one notification per recipient with identical payload."""
    unique_recipients = {rid for rid in recipient_ids if rid}
    for rid in unique_recipients:
        try:
            create_notification(tenant_id, rid, type, payload)
        except Exception:
            logger.exception(
                f"Failed to create {type} notification for {rid}",
            )


def list_notifications(
    tenant_id: str,
    recipient_id: str,
    limit: int = 20,
) -> tuple[list[NotificationModel], str | None]:
    """List notifications for a recipient (newest first).

    Returns the raw notification models plus the player's `read_until` overlay
    timestamp. The caller is responsible for computing effective read state.
    """
    results = (
        BaseEntity.query(f"TENANT#{tenant_id}")
        .starts_with(f"NOTIF#{recipient_id}#")
        .reverse()
        .limit(limit)
        .all()
    )
    notifications = [r for r in results if isinstance(r, NotificationModel)]

    player = _get_player(tenant_id, recipient_id)
    read_until = player.notifications_read_until if player else None

    return notifications, read_until


def _short_ttl(now: datetime) -> int:
    return int((now + timedelta(days=TTL_DAYS_READ)).timestamp())


def mark_read(tenant_id: str, recipient_id: str, notif_id: str) -> bool:
    """Mark a single notification as read and shorten its TTL.

    Returns True if the item existed and was updated, False otherwise.
    """
    now = datetime.now(UTC)
    sk = _sk(recipient_id, notif_id)
    existing = BaseEntity.get(f"TENANT#{tenant_id}", sk)
    if not existing or not isinstance(existing, NotificationModel):
        return False

    NotificationModel.update(existing.pk, existing.sk).set("read", True).set(
        "expires_at", _short_ttl(now)
    ).set("updated_at", now).execute()
    return True


def mark_all_read(tenant_id: str, recipient_id: str) -> int:
    """Mark every unread notification for the recipient as read.

    Also shortens each record's TTL so read notifications expire within
    TTL_DAYS_READ instead of the default. Also updates the player-level
    `notifications_read_until` as a safety overlay for legacy clients.

    Returns the number of records updated.
    """
    now = datetime.now(UTC)
    results = (
        BaseEntity.query(f"TENANT#{tenant_id}")
        .starts_with(f"NOTIF#{recipient_id}#")
        .all()
    )

    updated = 0
    short_ttl = _short_ttl(now)
    for item in results:
        if not isinstance(item, NotificationModel):
            continue
        if item.read:
            continue
        NotificationModel.update(item.pk, item.sk).set("read", True).set(
            "expires_at", short_ttl
        ).set("updated_at", now).execute()
        updated += 1

    player = _get_player(tenant_id, recipient_id)
    if player:
        PlayerModel.update(player.pk, player.sk).set(
            "notifications_read_until", now.isoformat()
        ).set("updated_at", now).execute()

    return updated


def is_effectively_read(
    notification: NotificationModel,
    read_until: str | None,
) -> bool:
    """Compute effective read state.

    Per-item `read` flag is authoritative. The overlay `read_until` is only
    consulted as a fallback for notifications still pending migration from
    the earlier overlay-only approach.
    """
    if notification.read:
        return True
    if read_until is None:
        return False
    return notification.created_at.isoformat() <= read_until


def _get_player(tenant_id: str, player_id: str) -> PlayerModel | None:
    result = BaseEntity.get(f"TENANT#{tenant_id}", f"PLAYER#{player_id}")
    if result and isinstance(result, PlayerModel):
        return result
    return None
