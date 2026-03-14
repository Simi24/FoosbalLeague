"""Match service - match recording and ELO orchestration."""

import uuid
from datetime import datetime, timezone

from libs.commons.logging import logger
from models.base import BaseEntity
from models.match import MatchModel
from models.rating import RatingModel
from models.season import EloHistoryModel
from services.elo_service import calculate_elo_changes
from services.league_service import get_enrollment, get_league


def record_match(
    tenant_id: str,
    league_id: str,
    team1_player_ids: list[str],
    team2_player_ids: list[str],
    team1_score: int,
    team2_score: int,
    submitted_by: str,
) -> MatchModel:
    """Record a new match with PENDING status."""
    match_id = str(uuid.uuid4())[:8]
    now = datetime.now(timezone.utc)
    timestamp = now.isoformat()

    match = MatchModel(
        pk=f"TENANT#{tenant_id}",
        sk=f"MATCH#{match_id}",
        gsi1_pk=f"LEAGUE#{league_id}",
        gsi1_sk=f"MATCH#{timestamp}#{match_id}",
        match_id=match_id,
        league_id=league_id,
        team1_player_ids=team1_player_ids,
        team2_player_ids=team2_player_ids,
        team1_score=team1_score,
        team2_score=team2_score,
        status="PENDING",
        submitted_by=submitted_by,
        created_at=now,
        updated_at=now,
    )
    match.save()

    # Increment match count on league
    league = get_league(tenant_id, league_id)
    if league:
        from models.league import LeagueModel

        LeagueModel.update(league.pk, league.sk).set(
            "match_count", league.match_count + 1
        ).set("updated_at", now).execute()

    logger.info(f"Recorded match {match_id} in league {league_id}")
    return match


def get_match(tenant_id: str, match_id: str) -> MatchModel | None:
    """Get match by ID."""
    result = BaseEntity.get(f"TENANT#{tenant_id}", f"MATCH#{match_id}")
    if result and isinstance(result, MatchModel):
        return result
    return None


def confirm_match(
    tenant_id: str,
    match_id: str,
    confirmed_by: str,
) -> MatchModel | None:
    """Confirm a pending match, compute ELO changes, update ratings.

    The confirmer must be either:
    - A player from the opposing team, OR
    - A league admin
    """
    match = get_match(tenant_id, match_id)
    if not match or match.status != "PENDING":
        return None

    now = datetime.now(timezone.utc)

    # Gather current ratings for all players
    team1_elos: list[tuple[str, int, int]] = []
    team2_elos: list[tuple[str, int, int]] = []

    for pid in match.team1_player_ids:
        rating = _get_rating(tenant_id, match.league_id, pid)
        if rating:
            team1_elos.append((pid, rating.elo, rating.matches_played))

    for pid in match.team2_player_ids:
        rating = _get_rating(tenant_id, match.league_id, pid)
        if rating:
            team2_elos.append((pid, rating.elo, rating.matches_played))

    if not team1_elos or not team2_elos:
        logger.error(f"Missing ratings for match {match_id}")
        return None

    # Calculate ELO changes
    elo_changes = calculate_elo_changes(
        team1_elos, team2_elos, match.team1_score, match.team2_score
    )

    # Update ratings and create history entries
    is_team1_winner = match.team1_score > match.team2_score
    all_player_ids = match.team1_player_ids + match.team2_player_ids

    for pid in all_player_ids:
        delta = elo_changes.get(pid, 0)
        is_winner = (pid in match.team1_player_ids and is_team1_winner) or (
            pid in match.team2_player_ids and not is_team1_winner
        )
        _update_rating(tenant_id, match.league_id, pid, delta, is_winner, now)
        _write_elo_history(
            tenant_id, match.league_id, pid, match.match_id, delta, now
        )

    # Update match status
    elo_changes_serializable = {
        pid: {"delta": delta} for pid, delta in elo_changes.items()
    }

    MatchModel.update(match.pk, match.sk).set(
        "status", "CONFIRMED"
    ).set("confirmed_by", confirmed_by).set(
        "elo_changes", elo_changes_serializable
    ).set("updated_at", now).execute()

    logger.info(f"Confirmed match {match_id}, ELO changes: {elo_changes}")

    # Evaluate achievements
    from services.achievement_service import evaluate_achievements

    confirmed_match = get_match(tenant_id, match_id)
    if confirmed_match:
        evaluate_achievements(tenant_id, league_id=match.league_id, match=confirmed_match)

    return confirmed_match


def dispute_match(
    tenant_id: str,
    match_id: str,
) -> MatchModel | None:
    """Dispute a pending match."""
    match = get_match(tenant_id, match_id)
    if not match or match.status != "PENDING":
        return None

    now = datetime.now(timezone.utc)
    MatchModel.update(match.pk, match.sk).set(
        "status", "DISPUTED"
    ).set("updated_at", now).execute()

    logger.info(f"Disputed match {match_id}")
    return get_match(tenant_id, match_id)


def list_matches_by_league(league_id: str) -> list[MatchModel]:
    """Get all matches for a league via GSI1."""
    results = (
        BaseEntity.query_index("GSI1", f"LEAGUE#{league_id}")
        .starts_with("MATCH#")
        .all()
    )
    return [item for item in results if isinstance(item, MatchModel)]


def _get_rating(
    tenant_id: str, league_id: str, player_id: str
) -> RatingModel | None:
    """Get current rating for a player in a league."""
    result = BaseEntity.get(
        f"TENANT#{tenant_id}", f"RATING#{league_id}#{player_id}"
    )
    if result and isinstance(result, RatingModel):
        return result
    return None


def _update_rating(
    tenant_id: str,
    league_id: str,
    player_id: str,
    delta: int,
    is_winner: bool,
    now: datetime,
) -> None:
    """Update a player's rating after a confirmed match.

    Deletes old rating item, writes new one with updated GSI1 SK (inverted ELO).
    """
    old_rating = _get_rating(tenant_id, league_id, player_id)
    if not old_rating:
        return

    new_elo = max(0, old_rating.elo + delta)
    inverted_elo = str(9999 - new_elo).zfill(4)

    # Delete old and write new (GSI1 SK changes)
    RatingModel.delete(old_rating.pk, old_rating.sk)

    new_rating = RatingModel(
        pk=f"TENANT#{tenant_id}",
        sk=f"RATING#{league_id}#{player_id}",
        gsi1_pk=f"LEAGUE#{league_id}",
        gsi1_sk=f"RATING#{inverted_elo}#{player_id}",
        league_id=league_id,
        player_id=player_id,
        display_name=old_rating.display_name,
        elo=new_elo,
        matches_played=old_rating.matches_played + 1,
        wins=old_rating.wins + (1 if is_winner else 0),
        losses=old_rating.losses + (0 if is_winner else 1),
        created_at=old_rating.created_at,
        updated_at=now,
    )
    new_rating.save()

    # Also update enrollment
    enrollment = BaseEntity.get(
        f"TENANT#{tenant_id}", f"ENROLL#{league_id}#{player_id}"
    )
    if enrollment:
        from models.enrollment import EnrollmentModel

        EnrollmentModel.update(enrollment.pk, enrollment.sk).set(
            "current_elo", new_elo
        ).set("updated_at", now).execute()


def _write_elo_history(
    tenant_id: str,
    league_id: str,
    player_id: str,
    match_id: str,
    delta: int,
    now: datetime,
) -> None:
    """Write an ELO history snapshot."""
    rating = _get_rating(tenant_id, league_id, player_id)
    elo = rating.elo if rating else 1200

    timestamp = now.isoformat()
    history = EloHistoryModel(
        pk=f"TENANT#{tenant_id}",
        sk=f"ELOHIST#{league_id}#{player_id}#{timestamp}",
        league_id=league_id,
        player_id=player_id,
        match_id=match_id,
        elo=elo,
        delta=delta,
        created_at=now,
        updated_at=now,
    )
    history.save()
