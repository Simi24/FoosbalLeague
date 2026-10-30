"""Match service - match recording and ELO orchestration."""

import uuid
from datetime import UTC, datetime

from libs.commons.logging import logger
from models.base import BaseEntity
from models.match import MatchModel
from models.rating import RatingModel
from models.season import EloHistoryModel
from schemas.confirmation import (
    ConfirmationResult,
    EloChangeDetail,
    UnlockedAchievement,
)
from schemas.match_context import MatchContext, PlayerMatchResult
from services.achievement_service import ACHIEVEMENT_CATALOG, evaluate_achievements
from services.elo_service import calculate_elo_changes
from services.exceptions import MatchNotFoundError, MissingRatingsError
from services.league_service import get_league
from services.notification_service import (
    create_notification,
    create_notifications_bulk,
)


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
    now = datetime.now(UTC)
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

    _notify_match_pending(
        tenant_id, match, league.name if league else league_id, submitted_by
    )

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
) -> ConfirmationResult:
    """Confirm a pending match, compute ELO changes, update ratings.

    Returns a ConfirmationResult with the confirmed match, per-player ELO
    change details, and any newly unlocked achievements.

    Raises:
        MatchNotFoundError: match does not exist or is not PENDING.
        MissingRatingsError: one or both teams lack rating records.
    """
    match = get_match(tenant_id, match_id)
    if not match or match.status != "PENDING":
        raise MatchNotFoundError(match_id)

    now = datetime.now(UTC)

    # ------------------------------------------------------------------
    # 1. Gather current ratings — capture elo_before per player
    # ------------------------------------------------------------------
    team1_elos: list[tuple[str, int, int]] = []
    team2_elos: list[tuple[str, int, int]] = []
    rating_snapshot: dict[
        str, tuple[int, str, int, int]
    ] = {}  # pid -> (elo_before, display_name, matches_played, wins)

    for pid in match.team1_player_ids:
        rating = _get_rating(tenant_id, match.league_id, pid)
        if rating:
            team1_elos.append((pid, rating.elo, rating.matches_played))
            rating_snapshot[pid] = (
                rating.elo,
                rating.display_name,
                rating.matches_played,
                rating.wins,
            )

    for pid in match.team2_player_ids:
        rating = _get_rating(tenant_id, match.league_id, pid)
        if rating:
            team2_elos.append((pid, rating.elo, rating.matches_played))
            rating_snapshot[pid] = (
                rating.elo,
                rating.display_name,
                rating.matches_played,
                rating.wins,
            )

    if not team1_elos or not team2_elos:
        logger.error(f"Missing ratings for match {match_id}")
        raise MissingRatingsError(match_id)

    # ------------------------------------------------------------------
    # 2. Calculate ELO changes
    # ------------------------------------------------------------------
    elo_changes = calculate_elo_changes(
        team1_elos, team2_elos, match.team1_score, match.team2_score
    )

    # ------------------------------------------------------------------
    # 3. Build EloChangeDetail objects
    # ------------------------------------------------------------------
    elo_details: list[EloChangeDetail] = []
    for pid in match.team1_player_ids + match.team2_player_ids:
        delta = elo_changes.get(pid, 0)
        elo_before, display_name, _mp, _w = rating_snapshot.get(pid, (1200, "", 0, 0))
        elo_details.append(
            EloChangeDetail(
                player_id=pid,
                display_name=display_name,
                elo_before=elo_before,
                elo_after=elo_before + delta,
                delta=delta,
            )
        )

    # ------------------------------------------------------------------
    # 4. Update ratings and write history
    # ------------------------------------------------------------------
    is_team1_winner = match.team1_score > match.team2_score

    for pid in match.team1_player_ids + match.team2_player_ids:
        delta = elo_changes.get(pid, 0)
        is_winner = (pid in match.team1_player_ids and is_team1_winner) or (
            pid in match.team2_player_ids and not is_team1_winner
        )
        _update_rating(tenant_id, match.league_id, pid, delta, is_winner, now)
        _write_elo_history(tenant_id, match.league_id, pid, match.match_id, delta, now)

    # ------------------------------------------------------------------
    # 5. Persist CONFIRMED status
    # ------------------------------------------------------------------
    elo_changes_serializable = {
        pid: {"delta": delta} for pid, delta in elo_changes.items()
    }

    MatchModel.update(match.pk, match.sk).set("status", "CONFIRMED").set(
        "confirmed_by", confirmed_by
    ).set("elo_changes", elo_changes_serializable).set("updated_at", now).execute()

    logger.info(f"Confirmed match {match_id}, ELO changes: {elo_changes}")

    # ------------------------------------------------------------------
    # 6. Evaluate achievements and capture newly unlocked
    # ------------------------------------------------------------------
    confirmed = get_match(tenant_id, match_id)
    if not confirmed:
        confirmed = match  # fallback — should not happen

    # Build PlayerMatchResult for each player
    player_results: dict[str, PlayerMatchResult] = {}
    for pid in match.team1_player_ids + match.team2_player_ids:
        delta = elo_changes.get(pid, 0)
        elo_before, _name, matches_played, wins = rating_snapshot.get(
            pid, (1200, "", 0, 0)
        )
        is_winner = (pid in match.team1_player_ids and is_team1_winner) or (
            pid in match.team2_player_ids and not is_team1_winner
        )
        player_results[pid] = PlayerMatchResult(
            player_id=pid,
            team=1 if pid in match.team1_player_ids else 2,
            won=is_winner,
            elo_before=elo_before,
            elo_delta=delta,
            elo_after=elo_before + delta,
            matches_played=matches_played + 1,
            wins=wins + (1 if is_winner else 0),
        )

    team1_avg_elo_before = sum(
        rating_snapshot[p][0] for p in match.team1_player_ids if p in rating_snapshot
    ) / max(len(match.team1_player_ids), 1)
    team2_avg_elo_before = sum(
        rating_snapshot[p][0] for p in match.team2_player_ids if p in rating_snapshot
    ) / max(len(match.team2_player_ids), 1)

    ctx = MatchContext(
        tenant_id=tenant_id,
        league_id=match.league_id,
        match=confirmed,
        players=player_results,
        team1_avg_elo_before=team1_avg_elo_before,
        team2_avg_elo_before=team2_avg_elo_before,
    )
    try:
        raw_unlocked = evaluate_achievements(ctx)
    except Exception:
        logger.exception(f"Achievement evaluation failed for match {match_id}")
        raw_unlocked = []

    newly_unlocked = _build_unlocked_achievements(raw_unlocked)

    league = get_league(tenant_id, match.league_id)
    league_name = league.name if league else match.league_id
    _notify_match_confirmed(
        tenant_id, confirmed, league_name, confirmed_by, elo_details
    )
    _notify_achievements_unlocked(tenant_id, confirmed, league_name, newly_unlocked)

    return ConfirmationResult(
        match=confirmed,
        elo_changes=elo_details,
        newly_unlocked=newly_unlocked,
    )


def delete_match(
    tenant_id: str,
    match_id: str,
    deleted_by: str,
    reason: str | None,
) -> MatchModel | None:
    """Soft-delete a match. If CONFIRMED, revert ELO/counters and history.

    Idempotent: deleting an already-deleted match is a no-op (returns the
    existing record). Returns None if the match does not exist.
    """
    match = get_match(tenant_id, match_id)
    if not match:
        return None
    if match.deleted:
        return match

    now = datetime.now(UTC)
    league = get_league(tenant_id, match.league_id)
    league_name = league.name if league else match.league_id

    reverted_deltas: dict[str, int] = {}

    if match.status == "CONFIRMED":
        is_team1_winner = match.team1_score > match.team2_score
        for pid in match.team1_player_ids + match.team2_player_ids:
            change = match.elo_changes.get(pid)
            delta = change.get("delta", 0) if isinstance(change, dict) else 0
            reverted_deltas[pid] = delta

            is_winner = (pid in match.team1_player_ids and is_team1_winner) or (
                pid in match.team2_player_ids and not is_team1_winner
            )
            _revert_rating(tenant_id, match.league_id, pid, delta, is_winner, now)
            _delete_elo_history_for_match(tenant_id, match.league_id, pid, match_id)

    if league:
        from models.league import LeagueModel

        new_count = max(0, league.match_count - 1)
        LeagueModel.update(league.pk, league.sk).set("match_count", new_count).set(
            "updated_at", now
        ).execute()

    MatchModel.update(match.pk, match.sk).set("deleted", True).set(
        "deleted_at", now
    ).set("deleted_by", deleted_by).set("deletion_reason", reason or "").set(
        "updated_at", now
    ).execute()

    logger.info(
        f"Deleted match {match_id} (status was {match.status}) by {deleted_by}; "
        f"reverted deltas: {reverted_deltas}"
    )

    deleted = get_match(tenant_id, match_id) or match
    _notify_match_deleted(tenant_id, deleted, league_name, deleted_by, reverted_deltas)

    return deleted


def dispute_match(
    tenant_id: str,
    match_id: str,
    disputed_by: str,
) -> MatchModel | None:
    """Dispute a pending match."""
    match = get_match(tenant_id, match_id)
    if not match or match.status != "PENDING":
        return None

    now = datetime.now(UTC)
    MatchModel.update(match.pk, match.sk).set("status", "DISPUTED").set(
        "updated_at", now
    ).execute()

    logger.info(f"Disputed match {match_id}")
    disputed = get_match(tenant_id, match_id)

    if disputed:
        league = get_league(tenant_id, match.league_id)
        league_name = league.name if league else match.league_id
        _notify_match_disputed(tenant_id, disputed, league_name, disputed_by)

    return disputed


def list_matches_by_league(
    league_id: str, include_deleted: bool = False
) -> list[MatchModel]:
    """Get all matches for a league via GSI1.

    By default soft-deleted matches are filtered out. Pass
    `include_deleted=True` to return them (audit views).
    """
    results = (
        BaseEntity.query_index("GSI1", f"LEAGUE#{league_id}")
        .starts_with("MATCH#")
        .all()
    )
    matches = [item for item in results if isinstance(item, MatchModel)]
    if include_deleted:
        return matches
    return [m for m in matches if not m.deleted]


def _build_unlocked_achievements(raw_unlocked: list[str]) -> list[UnlockedAchievement]:
    """Convert 'player_id:achievement_type' strings into UnlockedAchievement objects.

    Looks up each type in ACHIEVEMENT_CATALOG; unknown types are silently skipped.
    """
    catalog_map = {entry["type"]: entry for entry in ACHIEVEMENT_CATALOG}
    result: list[UnlockedAchievement] = []
    for entry in raw_unlocked:
        parts = entry.split(":", 1)
        if len(parts) != 2:
            continue
        pid, atype = parts
        defn = catalog_map.get(atype)
        if not defn:
            continue
        result.append(
            UnlockedAchievement(
                player_id=pid,
                achievement_type=atype,
                name=defn["name"],
                description=defn["description"],
                icon=defn["icon"],
                rarity=defn["rarity"],
            )
        )
    return result


def _get_rating(tenant_id: str, league_id: str, player_id: str) -> RatingModel | None:
    """Get current rating for a player in a league."""
    result = BaseEntity.get(f"TENANT#{tenant_id}", f"RATING#{league_id}#{player_id}")
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


def _revert_rating(
    tenant_id: str,
    league_id: str,
    player_id: str,
    delta: int,
    was_winner: bool,
    now: datetime,
) -> None:
    """Reverse a player's rating after a match deletion.

    Mirrors `_update_rating` but with -delta and decremented counters.
    Floors at zero so we never write negative values.
    """
    old_rating = _get_rating(tenant_id, league_id, player_id)
    if not old_rating:
        return

    new_elo = max(0, old_rating.elo - delta)
    new_mp = max(0, old_rating.matches_played - 1)
    new_wins = max(0, old_rating.wins - (1 if was_winner else 0))
    new_losses = max(0, old_rating.losses - (0 if was_winner else 1))
    inverted_elo = str(9999 - new_elo).zfill(4)

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
        matches_played=new_mp,
        wins=new_wins,
        losses=new_losses,
        created_at=old_rating.created_at,
        updated_at=now,
    )
    new_rating.save()

    enrollment = BaseEntity.get(
        f"TENANT#{tenant_id}", f"ENROLL#{league_id}#{player_id}"
    )
    if enrollment:
        from models.enrollment import EnrollmentModel

        EnrollmentModel.update(enrollment.pk, enrollment.sk).set(
            "current_elo", new_elo
        ).set("updated_at", now).execute()


def _delete_elo_history_for_match(
    tenant_id: str,
    league_id: str,
    player_id: str,
    match_id: str,
) -> None:
    """Delete EloHistoryModel rows for a given (player, match) pair.

    History rows are keyed by timestamp, not match_id, so we scan the
    player's history and filter by `match_id`. There is at most one row
    per player per match.
    """
    results = (
        BaseEntity.query(f"TENANT#{tenant_id}")
        .starts_with(f"ELOHIST#{league_id}#{player_id}#")
        .all()
    )
    for item in results:
        if isinstance(item, EloHistoryModel) and item.match_id == match_id:
            EloHistoryModel.delete(item.pk, item.sk)


# ---------------------------------------------------------------------------
# Notification triggers
# ---------------------------------------------------------------------------


def _notify_match_pending(
    tenant_id: str,
    match: MatchModel,
    league_name: str,
    submitter_id: str,
) -> None:
    """Notify all participants (except submitter) that a match awaits their action."""
    try:
        recipients = [
            pid
            for pid in match.team1_player_ids + match.team2_player_ids
            if pid != submitter_id
        ]
        payload = {
            "league_id": match.league_id,
            "league_name": league_name,
            "match_id": match.match_id,
            "team1_score": match.team1_score,
            "team2_score": match.team2_score,
            "submitter_id": submitter_id,
        }
        create_notifications_bulk(tenant_id, recipients, "MATCH_PENDING", payload)
    except Exception:
        logger.exception(f"Failed to emit MATCH_PENDING for match {match.match_id}")


def _notify_match_confirmed(
    tenant_id: str,
    match: MatchModel,
    league_name: str,
    confirmed_by: str,
    elo_details: list["EloChangeDetail"],
) -> None:
    """Notify each participant (except confirmer) with their personal ELO delta."""
    try:
        deltas = {d.player_id: d.delta for d in elo_details}
        is_team1_winner = match.team1_score > match.team2_score
        for pid in match.team1_player_ids + match.team2_player_ids:
            if pid == confirmed_by:
                continue
            won = (pid in match.team1_player_ids and is_team1_winner) or (
                pid in match.team2_player_ids and not is_team1_winner
            )
            payload = {
                "league_id": match.league_id,
                "league_name": league_name,
                "match_id": match.match_id,
                "won": won,
                "delta": deltas.get(pid, 0),
            }
            create_notification(tenant_id, pid, "MATCH_CONFIRMED", payload)
    except Exception:
        logger.exception(f"Failed to emit MATCH_CONFIRMED for match {match.match_id}")


def _notify_match_disputed(
    tenant_id: str,
    match: MatchModel,
    league_name: str,
    disputed_by: str,
) -> None:
    """Notify the submitter + all participants (except the disputer)."""
    try:
        recipients = set(match.team1_player_ids + match.team2_player_ids)
        if match.submitted_by:
            recipients.add(match.submitted_by)
        recipients.discard(disputed_by)
        payload = {
            "league_id": match.league_id,
            "league_name": league_name,
            "match_id": match.match_id,
        }
        create_notifications_bulk(
            tenant_id, list(recipients), "MATCH_DISPUTED", payload
        )
    except Exception:
        logger.exception(f"Failed to emit MATCH_DISPUTED for match {match.match_id}")


def _notify_match_deleted(
    tenant_id: str,
    match: MatchModel,
    league_name: str,
    deleted_by: str,
    reverted_deltas: dict[str, int],
) -> None:
    """Notify all participants + submitter + confirmer (except deleter).

    Each recipient gets their own `reverted_delta` so the UI can show
    the personal ELO swing. Empty dict for non-CONFIRMED deletions —
    `reverted_delta` defaults to 0.
    """
    try:
        recipients = set(match.team1_player_ids + match.team2_player_ids)
        if match.submitted_by:
            recipients.add(match.submitted_by)
        if match.confirmed_by:
            recipients.add(match.confirmed_by)
        recipients.discard(deleted_by)

        for pid in recipients:
            payload = {
                "league_id": match.league_id,
                "league_name": league_name,
                "match_id": match.match_id,
                "team1_score": match.team1_score,
                "team2_score": match.team2_score,
                "reverted_delta": reverted_deltas.get(pid, 0),
                "reason": match.deletion_reason or "",
            }
            create_notification(tenant_id, pid, "MATCH_DELETED", payload)
    except Exception:
        logger.exception(f"Failed to emit MATCH_DELETED for match {match.match_id}")


def _notify_achievements_unlocked(
    tenant_id: str,
    match: MatchModel,
    league_name: str,
    newly_unlocked: list["UnlockedAchievement"],
) -> None:
    """Notify each player about their freshly-unlocked achievements."""
    try:
        for ach in newly_unlocked:
            payload = {
                "league_id": match.league_id,
                "league_name": league_name,
                "achievement_type": ach.achievement_type,
                "name": ach.name,
                "description": ach.description,
                "icon": ach.icon,
                "rarity": ach.rarity,
            }
            create_notification(
                tenant_id, ach.player_id, "ACHIEVEMENT_UNLOCKED", payload
            )
    except Exception:
        logger.exception(
            f"Failed to emit ACHIEVEMENT_UNLOCKED for match {match.match_id}"
        )
