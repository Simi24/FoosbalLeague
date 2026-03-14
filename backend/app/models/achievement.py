"""Achievement entity - unlocked achievements per player per league."""

from datetime import datetime

from models.base import BaseEntity


@BaseEntity.register("ACHIEVEMENT")
class AchievementModel(BaseEntity):
    """Unlocked achievement for a player in a league.

    PK: TENANT#<tenant_id>
    SK: ACHIEVE#<league_id>#<player_id>#<achievement_type>
    GSI1: LEAGUE#<league_id> -> ACHIEVE#<player_id>#<achievement_type>
    """

    league_id: str
    player_id: str
    achievement_type: str
    unlocked_at: datetime
