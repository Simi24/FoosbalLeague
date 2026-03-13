from fastapi import APIRouter, Depends, HTTPException

from dependencies.tenant import get_tenant_id
from schemas.ranking import (
    EloHistoryPoint,
    EloHistoryResponse,
    LeaderboardResponse,
    RankingEntry,
)
from services.league_service import get_league
from services.ranking_service import get_elo_history, get_leaderboard

router = APIRouter(
    prefix="/api/v1/rankings",
    tags=["rankings"],
)


@router.get("/league/{league_id}", response_model=LeaderboardResponse)
async def read_leaderboard(
    league_id: str,
    tenant_id: str = Depends(get_tenant_id),
) -> LeaderboardResponse:
    """Get leaderboard for a league."""
    league = get_league(tenant_id, league_id)
    if not league:
        raise HTTPException(status_code=404, detail="League not found")

    ratings = get_leaderboard(league_id)
    entries = []
    for i, r in enumerate(ratings, start=1):
        total = r.matches_played or 1
        entries.append(
            RankingEntry(
                rank=i,
                player_id=r.player_id,
                display_name=r.display_name,
                elo=r.elo,
                matches_played=r.matches_played,
                wins=r.wins,
                losses=r.losses,
                win_rate=round(r.wins / total, 2) if r.matches_played > 0 else 0.0,
            )
        )

    return LeaderboardResponse(
        league_id=league_id,
        league_name=league.name,
        entries=entries,
    )


@router.get("/player/{player_id}/history", response_model=EloHistoryResponse)
async def read_elo_history(
    player_id: str,
    league_id: str,
    tenant_id: str = Depends(get_tenant_id),
) -> EloHistoryResponse:
    """Get ELO history for a player in a league."""
    history = get_elo_history(tenant_id, league_id, player_id)
    points = [
        EloHistoryPoint(
            match_id=h.match_id,
            elo=h.elo,
            delta=h.delta,
            timestamp=h.created_at.isoformat() if hasattr(h.created_at, 'isoformat') else str(h.created_at),
        )
        for h in history
    ]

    return EloHistoryResponse(
        player_id=player_id,
        league_id=league_id,
        history=points,
    )
