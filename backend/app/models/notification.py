"""Notification entity - in-app user notifications."""

from typing import Literal

from models.base import BaseEntity

NotificationType = Literal[
    "MATCH_PENDING",
    "MATCH_CONFIRMED",
    "MATCH_DISPUTED",
    "ACHIEVEMENT_UNLOCKED",
]


@BaseEntity.register("NOTIFICATION")
class NotificationModel(BaseEntity):
    """Per-user in-app notification.

    PK: TENANT#<tenant_id>
    SK: NOTIF#<recipient_id>#<timestamp>#<notif_id>

    `expires_at` is an epoch-seconds integer used as DynamoDB TTL attribute;
    items are auto-deleted after 30 days.
    """

    notif_id: str
    recipient_id: str
    type: NotificationType
    payload: dict
    read: bool = False
    expires_at: int
