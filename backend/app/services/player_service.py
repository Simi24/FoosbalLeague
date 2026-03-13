"""Player service - business logic for player operations."""

import uuid
from datetime import datetime, timezone

from libs.commons.logging import logger
from models.base import BaseEntity
from models.player import PlayerModel


def create_player(
    tenant_id: str,
    cognito_sub: str,
    email: str,
    display_name: str,
) -> PlayerModel:
    """Create a new player in the tenant."""
    player_id = str(uuid.uuid4())[:8]
    now = datetime.now(timezone.utc)

    player = PlayerModel(
        pk=f"TENANT#{tenant_id}",
        sk=f"PLAYER#{player_id}",
        gsi3_pk=email,
        gsi3_sk=f"PLAYER#{player_id}",
        player_id=player_id,
        cognito_sub=cognito_sub,
        display_name=display_name,
        email=email,
        created_at=now,
        updated_at=now,
    )
    player.save()
    logger.info(f"Created player {player_id} ({display_name}) in tenant {tenant_id}")
    return player


def get_player(tenant_id: str, player_id: str) -> PlayerModel | None:
    """Get a player by ID."""
    result = BaseEntity.get(f"TENANT#{tenant_id}", f"PLAYER#{player_id}")
    if result and isinstance(result, PlayerModel):
        return result
    return None


def get_player_by_email(email: str) -> PlayerModel | None:
    """Lookup player by email via GSI3."""
    results = BaseEntity.query_index("GSI3", email).all()
    for item in results:
        if isinstance(item, PlayerModel):
            return item
    return None


def get_player_by_cognito_sub(tenant_id: str, cognito_sub: str) -> PlayerModel | None:
    """Find player by cognito sub within a tenant."""
    results = BaseEntity.query(f"TENANT#{tenant_id}").starts_with("PLAYER#").all()
    for item in results:
        if isinstance(item, PlayerModel) and item.cognito_sub == cognito_sub:
            return item
    return None


def list_players(tenant_id: str) -> list[PlayerModel]:
    """List all players in a tenant."""
    results = BaseEntity.query(f"TENANT#{tenant_id}").starts_with("PLAYER#").all()
    return [item for item in results if isinstance(item, PlayerModel)]
