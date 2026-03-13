"""ELO history entity - rating snapshot after each match."""

from models.base import BaseEntity


@BaseEntity.register("ELO_HISTORY")
class EloHistoryModel(BaseEntity):
    """ELO history snapshot after a match.

    PK: TENANT#<tenant_id>
    SK: ELOHIST#<league_id>#<player_id>#<timestamp>
    """

    league_id: str
    player_id: str
    match_id: str
    elo: int
    delta: int
