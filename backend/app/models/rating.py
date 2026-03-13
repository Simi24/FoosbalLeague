"""Rating entity - current ELO per player per league."""

from models.base import BaseEntity


@BaseEntity.register("RATING")
class RatingModel(BaseEntity):
    """Current ELO rating for a player in a league.

    PK: TENANT#<tenant_id>
    SK: RATING#<league_id>#<player_id>
    GSI1: LEAGUE#<league_id> -> RATING#<inverted_elo>#<player_id> (leaderboard)

    Leaderboard sorting: gsi1_sk stores inverted ELO (9999 - elo zero-padded)
    so ascending sort = descending ELO.
    """

    league_id: str
    player_id: str
    display_name: str
    elo: int = 1200
    matches_played: int = 0
    wins: int = 0
    losses: int = 0
