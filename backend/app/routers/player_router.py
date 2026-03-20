from dependencies.auth import AuthenticatedUser, get_current_user
from dependencies.tenant import get_tenant_id
from fastapi import APIRouter, Depends, HTTPException
from schemas.player import PlayerListItem, PlayerResponse, PlayerStatsResponse, UpdatePlayerRequest
from services.player_service import (
    get_player,
    get_player_by_cognito_sub,
    list_players,
    update_display_name,
)

router = APIRouter(
    prefix="/api/v1/players",
    tags=["players"],
)


@router.get("/", response_model=list[PlayerListItem])
async def read_players(
    tenant_id: str = Depends(get_tenant_id),
) -> list[PlayerListItem]:
    """List all players in the tenant (no email exposed)."""
    players = list_players(tenant_id)
    return [
        PlayerListItem(
            player_id=p.player_id,
            display_name=p.display_name,
            tenant_id=tenant_id,
            total_matches=p.total_matches,
            total_wins=p.total_wins,
            total_losses=p.total_losses,
        )
        for p in players
    ]


@router.get("/{player_id}", response_model=PlayerResponse)
async def read_player(
    player_id: str,
    tenant_id: str = Depends(get_tenant_id),
) -> PlayerResponse:
    """Get a player profile."""
    player = get_player(tenant_id, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    return PlayerResponse(
        player_id=player.player_id,
        display_name=player.display_name,
        email=player.email,
        tenant_id=tenant_id,
        total_matches=player.total_matches,
        total_wins=player.total_wins,
        total_losses=player.total_losses,
    )


@router.patch("/me", response_model=PlayerResponse)
async def update_me(
    body: UpdatePlayerRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> PlayerResponse:
    """Update the current player's display name."""
    player = get_player_by_cognito_sub(tenant_id, user.sub)
    if not player:
        raise HTTPException(status_code=400, detail="Player not registered")

    updated = update_display_name(tenant_id, player.player_id, body.display_name)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update")

    return PlayerResponse(
        player_id=updated.player_id,
        display_name=updated.display_name,
        email=updated.email,
        tenant_id=tenant_id,
        total_matches=updated.total_matches,
        total_wins=updated.total_wins,
        total_losses=updated.total_losses,
    )


@router.get("/{player_id}/stats", response_model=PlayerStatsResponse)
async def read_player_stats(
    player_id: str,
    tenant_id: str = Depends(get_tenant_id),
) -> PlayerStatsResponse:
    """Get aggregated player stats."""
    player = get_player(tenant_id, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    total = player.total_matches or 1
    return PlayerStatsResponse(
        player_id=player.player_id,
        display_name=player.display_name,
        total_matches=player.total_matches,
        total_wins=player.total_wins,
        total_losses=player.total_losses,
        win_rate=round(player.total_wins / total, 2)
        if player.total_matches > 0
        else 0.0,
    )
