"""Match entity - recorded match result."""

from datetime import datetime
from typing import Literal

from pydantic import Field

from models.base import BaseEntity


@BaseEntity.register("MATCH")
class MatchModel(BaseEntity):
    """Recorded match.

    PK: TENANT#<tenant_id>
    SK: MATCH#<match_id>
    GSI1: LEAGUE#<league_id> -> MATCH#<timestamp>#<match_id> (matches by league)
    """

    match_id: str
    league_id: str
    team1_player_ids: list[str]
    team2_player_ids: list[str]
    team1_score: int
    team2_score: int
    status: Literal["PENDING", "CONFIRMED", "DISPUTED"] = "PENDING"
    submitted_by: str = ""
    confirmed_by: str | None = None
    elo_changes: dict = Field(default_factory=dict)
    deleted: bool = False
    deleted_at: datetime | None = None
    deleted_by: str | None = None
    deletion_reason: str | None = None
