from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

NotificationTypeLiteral = Literal[
    "MATCH_PENDING",
    "MATCH_CONFIRMED",
    "MATCH_DISPUTED",
    "ACHIEVEMENT_UNLOCKED",
]


class NotificationResponse(BaseModel):
    """A single notification as returned by GET /notifications."""

    notif_id: str
    type: NotificationTypeLiteral
    payload: dict
    read: bool
    created_at: str

    model_config = ConfigDict(extra="forbid")


class NotificationListResponse(BaseModel):
    """Paginated-ish list of notifications plus the unread count.

    The list is capped server-side (default 20). `unread_count` reflects the
    unread notifications present in the returned list — anything beyond the
    cap is assumed already-consumed by the user and not surfaced as unread.
    """

    notifications: list[NotificationResponse] = Field(default_factory=list)
    unread_count: int

    model_config = ConfigDict(extra="forbid")
