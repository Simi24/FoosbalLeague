from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class TeamInput(BaseModel):
    """Team composition for match recording."""

    player_ids: list[str] = Field(..., min_length=1, max_length=2)
    score: int = Field(..., ge=0, le=99)

    model_config = ConfigDict(extra="forbid")


class RecordMatchRequest(BaseModel):
    """Record a new match result."""

    league_id: str
    team1: TeamInput
    team2: TeamInput

    model_config = ConfigDict(extra="forbid")


class EloChange(BaseModel):
    """ELO change for a single player."""

    player_id: str
    display_name: str
    elo_before: int
    elo_after: int
    delta: int

    model_config = ConfigDict(extra="forbid")


class MatchResponse(BaseModel):
    """Match details."""

    match_id: str
    league_id: str
    team1_player_ids: list[str]
    team2_player_ids: list[str]
    team1_score: int
    team2_score: int
    status: Literal["PENDING", "CONFIRMED", "DISPUTED"]
    submitted_by: str
    elo_changes: list[EloChange] = Field(default_factory=list)
    created_at: str

    model_config = ConfigDict(extra="forbid")
