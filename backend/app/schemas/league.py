from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class CreateLeagueRequest(BaseModel):
    """Create a new league."""

    name: str = Field(..., min_length=2, max_length=100)
    league_type: Literal["1v1", "2v2"] = Field(default="2v2")
    initial_elo: int = Field(default=1200, ge=100, le=3000)
    description: str = Field(default="", max_length=500)

    model_config = ConfigDict(extra="forbid")


class JoinByCodeRequest(BaseModel):
    """Join a league by invite code."""

    code: str = Field(..., min_length=4, max_length=10)

    model_config = ConfigDict(extra="forbid")


class UpdateLeagueRequest(BaseModel):
    """Update league settings."""

    name: str | None = Field(default=None, min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=500)

    model_config = ConfigDict(extra="forbid")


class LeagueResponse(BaseModel):
    """League details."""

    league_id: str
    name: str
    league_type: Literal["1v1", "2v2"]
    initial_elo: int
    description: str
    tenant_id: str
    member_count: int = 0
    match_count: int = 0

    model_config = ConfigDict(extra="forbid")


class LeagueMemberResponse(BaseModel):
    """League member (enrollment)."""

    player_id: str
    display_name: str
    role: Literal["player", "admin"]
    current_elo: int

    model_config = ConfigDict(extra="forbid")


class MyLeagueResponse(BaseModel):
    """League with enrollment info for current player."""

    league_id: str
    name: str
    league_type: Literal["1v1", "2v2"]
    description: str
    member_count: int
    match_count: int
    role: Literal["player", "admin"]
    current_elo: int
    invite_code: str | None = None

    model_config = ConfigDict(extra="forbid")
