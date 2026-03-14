"""Achievement schemas."""

from pydantic import BaseModel


class AchievementDefinition(BaseModel):
    type: str
    name: str
    description: str
    icon: str
    rarity: str
    unlocked: bool = False
    unlocked_at: str | None = None


class PlayerAchievementsResponse(BaseModel):
    player_id: str
    league_id: str
    achievements: list[AchievementDefinition]
