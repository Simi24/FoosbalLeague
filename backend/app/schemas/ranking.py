from pydantic import BaseModel, ConfigDict, Field


class RankingEntry(BaseModel):
    """Single entry in a leaderboard."""

    rank: int
    player_id: str
    display_name: str
    elo: int
    matches_played: int
    wins: int
    losses: int
    win_rate: float

    model_config = ConfigDict(extra="forbid")


class LeaderboardResponse(BaseModel):
    """Leaderboard for a league."""

    league_id: str
    league_name: str
    entries: list[RankingEntry] = Field(default_factory=list)

    model_config = ConfigDict(extra="forbid")


class EloHistoryPoint(BaseModel):
    """Single point in ELO history chart."""

    match_id: str
    elo: int
    delta: int
    timestamp: str

    model_config = ConfigDict(extra="forbid")


class EloHistoryResponse(BaseModel):
    """ELO history for a player in a league."""

    player_id: str
    league_id: str
    history: list[EloHistoryPoint] = Field(default_factory=list)

    model_config = ConfigDict(extra="forbid")
