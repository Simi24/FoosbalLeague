from fastapi import APIRouter, Depends

from dependencies.tenant import get_tenant_id
from schemas.achievement import AchievementDefinition, PlayerAchievementsResponse
from services.achievement_service import get_player_achievements

router = APIRouter(
    prefix="/api/v1/achievements",
    tags=["achievements"],
)


@router.get("/player/{player_id}", response_model=PlayerAchievementsResponse)
async def read_player_achievements(
    player_id: str,
    league_id: str,
    tenant_id: str = Depends(get_tenant_id),
) -> PlayerAchievementsResponse:
    """Get all achievements with unlock status for a player in a league."""
    achievements = get_player_achievements(tenant_id, league_id, player_id)
    return PlayerAchievementsResponse(
        player_id=player_id,
        league_id=league_id,
        achievements=[AchievementDefinition(**a) for a in achievements],
    )
