from pydantic import BaseModel, ConfigDict, Field


class PlayerListItem(BaseModel):
    """Player summary for list endpoints — no email."""

    player_id: str
    display_name: str
    tenant_id: str
    total_matches: int = 0
    total_wins: int = 0
    total_losses: int = 0

    model_config = ConfigDict(extra="forbid")


class PlayerResponse(BaseModel):
    """Player full profile (individual lookup only)."""

    player_id: str
    display_name: str
    email: str
    tenant_id: str
    total_matches: int = 0
    total_wins: int = 0
    total_losses: int = 0

    model_config = ConfigDict(extra="forbid")


class UpdatePlayerRequest(BaseModel):
    """Update player profile."""

    display_name: str = Field(..., min_length=2, max_length=50)

    model_config = ConfigDict(extra="forbid")


class PlayerStatsResponse(BaseModel):
    """Aggregated player stats."""

    player_id: str
    display_name: str
    total_matches: int = 0
    total_wins: int = 0
    total_losses: int = 0
    win_rate: float = 0.0
    leagues: list[str] = Field(default_factory=list)

    model_config = ConfigDict(extra="forbid")
