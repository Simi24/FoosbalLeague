"""Achievement service - definitions, evaluation, and storage."""

from datetime import datetime, timezone

from libs.commons.logging import logger
from models.achievement import AchievementModel
from models.base import BaseEntity
from models.match import MatchModel
from services.ranking_service import get_leaderboard, get_player_rating


ACHIEVEMENT_CATALOG = [
    {
        "type": "first_blood",
        "name": "First Blood",
        "description": "Win your first match",
        "icon": "swords",
        "rarity": "common",
    },
    {
        "type": "veteran",
        "name": "Veteran",
        "description": "Play 10 matches",
        "icon": "shield",
        "rarity": "common",
    },
    {
        "type": "giant_killer",
        "name": "Giant Killer",
        "description": "Beat a team with 50+ ELO advantage",
        "icon": "target",
        "rarity": "common",
    },
    {
        "type": "shutout",
        "name": "Shutout",
        "description": "Win a match without conceding a single goal",
        "icon": "lock",
        "rarity": "rare",
    },
    {
        "type": "hat_trick",
        "name": "Hat Trick",
        "description": "Win 3 matches in a row",
        "icon": "flame",
        "rarity": "rare",
    },
    {
        "type": "brick_wall",
        "name": "Brick Wall",
        "description": "Win 3 matches conceding 3 or fewer goals each",
        "icon": "castle",
        "rarity": "rare",
    },
    {
        "type": "centurion",
        "name": "Centurion",
        "description": "Play 50 matches",
        "icon": "crown",
        "rarity": "epic",
    },
    {
        "type": "on_fire",
        "name": "On Fire",
        "description": "Win 5 matches in a row",
        "icon": "fire",
        "rarity": "epic",
    },
    {
        "type": "underdog",
        "name": "Underdog",
        "description": "Beat a team with 100+ ELO advantage",
        "icon": "rocket",
        "rarity": "epic",
    },
    {
        "type": "top_dog",
        "name": "Top Dog",
        "description": "Reach #1 on the leaderboard",
        "icon": "trophy",
        "rarity": "legendary",
    },
]


def get_player_achievements(
    tenant_id: str,
    league_id: str,
    player_id: str,
) -> list[dict]:
    """Get all achievements with unlock status for a player in a league."""
    unlocked = _get_unlocked(tenant_id, league_id, player_id)
    unlocked_map = {a.achievement_type: a for a in unlocked}

    result = []
    for defn in ACHIEVEMENT_CATALOG:
        entry = {**defn, "unlocked": False, "unlocked_at": None}
        if defn["type"] in unlocked_map:
            a = unlocked_map[defn["type"]]
            entry["unlocked"] = True
            entry["unlocked_at"] = a.unlocked_at.isoformat() if hasattr(a.unlocked_at, "isoformat") else str(a.unlocked_at)
        result.append(entry)
    return result


def evaluate_achievements(
    tenant_id: str,
    league_id: str,
    match: MatchModel,
) -> list[str]:
    """Evaluate and award achievements after a confirmed match.

    Returns list of newly unlocked achievement types.
    """
    newly_unlocked: list[str] = []
    is_team1_winner = match.team1_score > match.team2_score
    all_player_ids = match.team1_player_ids + match.team2_player_ids

    for pid in all_player_ids:
        is_winner = (pid in match.team1_player_ids and is_team1_winner) or (
            pid in match.team2_player_ids and not is_team1_winner
        )

        unlocked = {a.achievement_type for a in _get_unlocked(tenant_id, league_id, pid)}
        rating = get_player_rating(tenant_id, league_id, pid)
        if not rating:
            continue

        new_for_player: list[str] = []

        # first_blood: first win
        if "first_blood" not in unlocked and is_winner and rating.wins >= 1:
            new_for_player.append("first_blood")

        # veteran: 10 matches
        if "veteran" not in unlocked and rating.matches_played >= 10:
            new_for_player.append("veteran")

        # centurion: 50 matches
        if "centurion" not in unlocked and rating.matches_played >= 50:
            new_for_player.append("centurion")

        # shutout: win with opponent scoring 0
        if "shutout" not in unlocked and is_winner:
            opponent_score = match.team2_score if pid in match.team1_player_ids else match.team1_score
            if opponent_score == 0:
                new_for_player.append("shutout")

        # giant_killer / underdog: beat a higher-rated team
        if is_winner:
            team1_elos = [get_player_rating(tenant_id, league_id, p) for p in match.team1_player_ids]
            team2_elos = [get_player_rating(tenant_id, league_id, p) for p in match.team2_player_ids]
            team1_avg = sum(r.elo for r in team1_elos if r) / max(len([r for r in team1_elos if r]), 1)
            team2_avg = sum(r.elo for r in team2_elos if r) / max(len([r for r in team2_elos if r]), 1)

            if pid in match.team1_player_ids:
                elo_diff = team2_avg - team1_avg
            else:
                elo_diff = team1_avg - team2_avg

            if "giant_killer" not in unlocked and elo_diff >= 50:
                new_for_player.append("giant_killer")
            if "underdog" not in unlocked and elo_diff >= 100:
                new_for_player.append("underdog")

        # Streak-based: hat_trick (3), on_fire (5), brick_wall (3 low-concede wins)
        if is_winner:
            recent = _get_recent_player_matches(league_id, pid, limit=5)
            if recent:
                streak = _count_win_streak(recent, pid)
                if "hat_trick" not in unlocked and streak >= 3:
                    new_for_player.append("hat_trick")
                if "on_fire" not in unlocked and streak >= 5:
                    new_for_player.append("on_fire")

                low_concede_streak = _count_low_concede_wins(recent, pid, max_concede=3)
                if "brick_wall" not in unlocked and low_concede_streak >= 3:
                    new_for_player.append("brick_wall")

        # top_dog: #1 on leaderboard
        if "top_dog" not in unlocked:
            leaderboard = get_leaderboard(league_id)
            if leaderboard and leaderboard[0].player_id == pid:
                new_for_player.append("top_dog")

        # Save newly unlocked
        for atype in new_for_player:
            _save_achievement(tenant_id, league_id, pid, atype)
            newly_unlocked.append(f"{pid}:{atype}")

    if newly_unlocked:
        logger.info(f"Achievements unlocked: {newly_unlocked}")
    return newly_unlocked


def _get_unlocked(
    tenant_id: str,
    league_id: str,
    player_id: str,
) -> list[AchievementModel]:
    """Get all unlocked achievements for a player in a league."""
    results = BaseEntity.query(
        f"TENANT#{tenant_id}",
    ).starts_with(f"ACHIEVE#{league_id}#{player_id}#").all()
    return [item for item in results if isinstance(item, AchievementModel)]


def _save_achievement(
    tenant_id: str,
    league_id: str,
    player_id: str,
    achievement_type: str,
) -> None:
    """Save an unlocked achievement."""
    now = datetime.now(timezone.utc)
    achievement = AchievementModel(
        pk=f"TENANT#{tenant_id}",
        sk=f"ACHIEVE#{league_id}#{player_id}#{achievement_type}",
        gsi1_pk=f"LEAGUE#{league_id}",
        gsi1_sk=f"ACHIEVE#{player_id}#{achievement_type}",
        league_id=league_id,
        player_id=player_id,
        achievement_type=achievement_type,
        unlocked_at=now,
        created_at=now,
        updated_at=now,
    )
    achievement.save()


def _get_recent_player_matches(
    league_id: str,
    player_id: str,
    limit: int = 5,
) -> list[MatchModel]:
    """Get recent confirmed matches for a player in a league."""
    results = (
        BaseEntity.query_index("GSI1", f"LEAGUE#{league_id}")
        .starts_with("MATCH#")
        .all()
    )
    matches = [
        item for item in results
        if isinstance(item, MatchModel)
        and item.status == "CONFIRMED"
        and (player_id in item.team1_player_ids or player_id in item.team2_player_ids)
    ]
    matches.sort(key=lambda m: m.created_at, reverse=True)
    return matches[:limit]


def _count_win_streak(matches: list[MatchModel], player_id: str) -> int:
    """Count consecutive wins from most recent match."""
    streak = 0
    for m in matches:
        is_team1 = player_id in m.team1_player_ids
        is_winner = (is_team1 and m.team1_score > m.team2_score) or (
            not is_team1 and m.team2_score > m.team1_score
        )
        if is_winner:
            streak += 1
        else:
            break
    return streak


def _count_low_concede_wins(
    matches: list[MatchModel],
    player_id: str,
    max_concede: int = 3,
) -> int:
    """Count consecutive wins where opponent scored <= max_concede."""
    streak = 0
    for m in matches:
        is_team1 = player_id in m.team1_player_ids
        is_winner = (is_team1 and m.team1_score > m.team2_score) or (
            not is_team1 and m.team2_score > m.team1_score
        )
        opponent_score = m.team2_score if is_team1 else m.team1_score
        if is_winner and opponent_score <= max_concede:
            streak += 1
        else:
            break
    return streak
