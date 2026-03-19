"""Confirmation result dataclasses returned by confirm_match()."""

from dataclasses import dataclass, field

from models.match import MatchModel


@dataclass(frozen=True)
class EloChangeDetail:
    """ELO change snapshot for a single player."""

    player_id: str
    display_name: str
    elo_before: int
    elo_after: int
    delta: int


@dataclass(frozen=True)
class UnlockedAchievement:
    """Achievement newly unlocked by a player during confirmation."""

    player_id: str
    achievement_type: str
    name: str
    description: str
    icon: str
    rarity: str


@dataclass(frozen=True)
class ConfirmationResult:
    """Full result of a successful match confirmation."""

    match: MatchModel
    elo_changes: list[EloChangeDetail] = field(default_factory=list)
    newly_unlocked: list[UnlockedAchievement] = field(default_factory=list)
