"""Player entity - registered user."""

from datetime import datetime

from models.base import BaseEntity


@BaseEntity.register("PLAYER")
class PlayerModel(BaseEntity):
    """Registered player.

    PK: TENANT#<tenant_id>
    SK: PLAYER#<player_id>
    GSI3: email -> PLAYER#<player_id> (email lookup)
    """

    player_id: str
    cognito_sub: str
    display_name: str
    email: str
    total_matches: int = 0
    total_wins: int = 0
    total_losses: int = 0
    notifications_read_until: str | None = None
    deleted: bool = False
    deleted_at: datetime | None = None
    last_export_at: datetime | None = None
