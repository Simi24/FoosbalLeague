"""Ranking service - leaderboard and ELO history."""

from models.base import BaseEntity
from models.rating import RatingModel
from models.season import EloHistoryModel


def get_leaderboard(league_id: str) -> list[RatingModel]:
    """Get leaderboard for a league via GSI1 (sorted by inverted ELO)."""
    results = (
        BaseEntity.query_index("GSI1", f"LEAGUE#{league_id}")
        .starts_with("RATING#")
        .all()
    )
    return [item for item in results if isinstance(item, RatingModel)]


def get_player_rating(
    tenant_id: str, league_id: str, player_id: str
) -> RatingModel | None:
    """Get a player's current rating in a league."""
    result = BaseEntity.get(
        f"TENANT#{tenant_id}", f"RATING#{league_id}#{player_id}"
    )
    if result and isinstance(result, RatingModel):
        return result
    return None


def get_elo_history(
    tenant_id: str, league_id: str, player_id: str
) -> list[EloHistoryModel]:
    """Get ELO history for a player in a league."""
    prefix = f"ELOHIST#{league_id}#{player_id}#"
    results = BaseEntity.query(f"TENANT#{tenant_id}").starts_with(prefix).all()
    return [item for item in results if isinstance(item, EloHistoryModel)]
