from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class StreakInfo(BaseModel):
    """Current streak (signed) and longest win streak."""

    current: int
    longest_win: int

    model_config = ConfigDict(extra="forbid")


class ExtremeMatch(BaseModel):
    """A best-win or worst-loss match."""

    match_id: str
    delta: int
    opponent_ids: list[str]
    opponent_names: list[str]
    team_score: int
    opponent_score: int
    created_at: str

    model_config = ConfigDict(extra="forbid")


class HeadToHead(BaseModel):
    """Pairwise record vs a selected opponent."""

    opponent_id: str
    opponent_name: str
    wins: int
    losses: int
    games: int
    elo_swing: int

    model_config = ConfigDict(extra="forbid")


class DreamPartner(BaseModel):
    """Teammate record (2v2 leagues only)."""

    partner_id: str
    partner_name: str
    wins: int
    losses: int
    games: int
    win_rate: float

    model_config = ConfigDict(extra="forbid")


class PlayerInsightsResponse(BaseModel):
    """Aggregated player insights scoped to a league."""

    player_id: str
    league_id: str
    league_type: Literal["1v1", "2v2"]
    streak: StreakInfo
    best_win: ExtremeMatch | None = None
    worst_loss: ExtremeMatch | None = None
    head_to_head: list[HeadToHead] = Field(default_factory=list)
    dream_partners: list[DreamPartner] = Field(default_factory=list)

    model_config = ConfigDict(extra="forbid")
