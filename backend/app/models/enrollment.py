"""Enrollment entity - player-league membership."""

from typing import Literal

from models.base import BaseEntity


@BaseEntity.register("ENROLLMENT")
class EnrollmentModel(BaseEntity):
    """Player-league enrollment.

    PK: TENANT#<tenant_id>
    SK: ENROLL#<league_id>#<player_id>
    GSI1: LEAGUE#<league_id> -> ENROLL#<player_id> (league members)
    """

    league_id: str
    player_id: str
    display_name: str
    role: Literal["player", "admin"] = "player"
    current_elo: int = 1200
