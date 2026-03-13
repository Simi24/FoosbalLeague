"""League entity - league instance."""

from typing import Literal

from models.base import BaseEntity


@BaseEntity.register("LEAGUE")
class LeagueModel(BaseEntity):
    """League instance.

    PK: TENANT#<tenant_id>
    SK: LEAGUE#<league_id>
    """

    league_id: str
    name: str
    league_type: Literal["1v1", "2v2"] = "2v2"
    initial_elo: int = 1200
    description: str = ""
    created_by: str = ""
    member_count: int = 0
    match_count: int = 0
