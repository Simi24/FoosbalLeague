"""ELO rating calculation service.

Pure math functions - no database access.
Uses team average ELO for expected score, individual K-factor per player.
"""

import math


def get_k_factor(games_played: int) -> int:
    """Return K-factor based on number of games played.

    0-10 games:  K=40 (fast convergence for new players)
    11-30 games: K=32 (settling period)
    31+ games:   K=24 (stable, small adjustments)
    """
    if games_played <= 10:
        return 40
    elif games_played <= 30:
        return 32
    return 24


def expected_score(team_avg_elo: float, opponent_avg_elo: float) -> float:
    """Calculate expected score using standard ELO formula.

    E = 1 / (1 + 10^((opponent - team) / 400))
    """
    return 1.0 / (1.0 + math.pow(10.0, (opponent_avg_elo - team_avg_elo) / 400.0))


def calculate_elo_changes(
    team1_elos: list[tuple[str, int, int]],
    team2_elos: list[tuple[str, int, int]],
    team1_score: int,
    team2_score: int,
) -> dict[str, int]:
    """Calculate ELO changes for all players in a match.

    Args:
        team1_elos: List of (player_id, current_elo, games_played) for team 1
        team2_elos: List of (player_id, current_elo, games_played) for team 2
        team1_score: Team 1's score
        team2_score: Team 2's score

    Returns:
        Dict mapping player_id -> elo_delta (positive for gain, negative for loss)
    """
    team1_avg = sum(elo for _, elo, _ in team1_elos) / len(team1_elos)
    team2_avg = sum(elo for _, elo, _ in team2_elos) / len(team2_elos)

    # Determine actual score: 1 for win, 0 for loss
    if team1_score > team2_score:
        team1_actual = 1.0
        team2_actual = 0.0
    elif team2_score > team1_score:
        team1_actual = 0.0
        team2_actual = 1.0
    else:
        team1_actual = 0.5
        team2_actual = 0.5

    team1_expected = expected_score(team1_avg, team2_avg)
    team2_expected = expected_score(team2_avg, team1_avg)

    changes: dict[str, int] = {}

    for player_id, _elo, games_played in team1_elos:
        k = get_k_factor(games_played)
        delta = round(k * (team1_actual - team1_expected))
        changes[player_id] = delta

    for player_id, _elo, games_played in team2_elos:
        k = get_k_factor(games_played)
        delta = round(k * (team2_actual - team2_expected))
        changes[player_id] = delta

    return changes
