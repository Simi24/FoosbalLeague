"""Match context dataclasses for achievement evaluation."""

from dataclasses import dataclass

from models.match import MatchModel


@dataclass(frozen=True)
class PlayerMatchResult:
    """Snapshot of a single player's result in a confirmed match."""

    player_id: str
    team: int  # 1 or 2
    won: bool
    elo_before: int
    elo_delta: int
    elo_after: int
    matches_played: int
    wins: int


@dataclass(frozen=True)
class MatchContext:
    """All data needed by achievement evaluation, built once by the caller."""

    tenant_id: str
    league_id: str
    match: MatchModel
    players: dict[str, PlayerMatchResult]  # keyed by player_id
    team1_avg_elo_before: float
    team2_avg_elo_before: float
