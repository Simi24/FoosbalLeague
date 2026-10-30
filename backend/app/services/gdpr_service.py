"""GDPR service - user data export + account deletion (with anonymization)."""

from datetime import UTC, datetime

from fastapi import HTTPException, status

from libs.cognito_client import admin_delete_user
from libs.commons.logging import logger
from models.achievement import AchievementModel
from models.base import BaseEntity
from models.enrollment import EnrollmentModel
from models.league import LeagueModel
from models.match import MatchModel
from models.player import PlayerModel
from models.rating import RatingModel
from models.season import EloHistoryModel
from services.achievement_service import ACHIEVEMENT_CATALOG
from services.player_service import get_player_by_cognito_sub

EXPORT_FORMAT_VERSION = "1.0"
EXPORT_COOLDOWN_SECONDS = 60
_ACHIEVEMENT_BY_TYPE = {a["type"]: a for a in ACHIEVEMENT_CATALOG}


class PlayerNotRegisteredError(HTTPException):
    def __init__(self) -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Player not registered",
        )


class ExportRateLimitedError(HTTPException):
    def __init__(self, retry_after: int) -> None:
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Export available again in {retry_after}s",
            headers={"Retry-After": str(retry_after)},
        )


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def export_user_data(tenant_id: str, cognito_sub: str) -> dict:
    """Build a domain-level export of the user's data — no DB internals."""
    player = get_player_by_cognito_sub(tenant_id, cognito_sub)
    if not player:
        raise PlayerNotRegisteredError()

    now = datetime.now(UTC)
    if player.last_export_at:
        elapsed = (now - player.last_export_at).total_seconds()
        if elapsed < EXPORT_COOLDOWN_SECONDS:
            raise ExportRateLimitedError(int(EXPORT_COOLDOWN_SECONDS - elapsed))

    PlayerModel.update(player.pk, player.sk).set("last_export_at", now).execute()

    player_id = player.player_id
    all_items = BaseEntity.query(f"TENANT#{tenant_id}").all()

    leagues_by_id: dict[str, LeagueModel] = {}
    enrollments: list[EnrollmentModel] = []
    ratings_by_league: dict[str, RatingModel] = {}
    matches: list[MatchModel] = []
    elo_entries: list[EloHistoryModel] = []
    achievements: list[AchievementModel] = []

    for item in all_items:
        if isinstance(item, LeagueModel):
            leagues_by_id[item.league_id] = item
        elif isinstance(item, EnrollmentModel) and item.player_id == player_id:
            enrollments.append(item)
        elif isinstance(item, RatingModel) and item.player_id == player_id:
            ratings_by_league[item.league_id] = item
        elif isinstance(item, MatchModel) and (
            player_id in item.team1_player_ids or player_id in item.team2_player_ids
        ):
            matches.append(item)
        elif isinstance(item, EloHistoryModel) and item.player_id == player_id:
            elo_entries.append(item)
        elif isinstance(item, AchievementModel) and item.player_id == player_id:
            achievements.append(item)

    leagues_out = []
    for e in enrollments:
        rating = ratings_by_league.get(e.league_id)
        league = leagues_by_id.get(e.league_id)
        leagues_out.append(
            {
                "league_id": e.league_id,
                "league_name": league.name if league else None,
                "joined_at": _iso(e.created_at),
                "role": e.role,
                "current_elo": e.current_elo,
                "matches_played": rating.matches_played if rating else 0,
                "wins": rating.wins if rating else 0,
                "losses": rating.losses if rating else 0,
            }
        )

    matches.sort(key=lambda m: m.created_at)
    matches_out = []
    for m in matches:
        league = leagues_by_id.get(m.league_id)
        your_team = 1 if player_id in m.team1_player_ids else 2
        elo_change = (
            m.elo_changes.get(player_id) if isinstance(m.elo_changes, dict) else None
        )
        matches_out.append(
            {
                "match_id": m.match_id,
                "league_id": m.league_id,
                "league_name": league.name if league else None,
                "played_at": _iso(m.created_at),
                "status": m.status,
                "your_team": your_team,
                "team1": {
                    "player_ids": m.team1_player_ids,
                    "score": m.team1_score,
                },
                "team2": {
                    "player_ids": m.team2_player_ids,
                    "score": m.team2_score,
                },
                "your_elo_change": elo_change,
            }
        )

    elo_entries.sort(key=lambda h: h.created_at)
    elo_history_out = [
        {
            "timestamp": _iso(h.created_at),
            "league_id": h.league_id,
            "match_id": h.match_id,
            "elo": h.elo,
            "delta": h.delta,
        }
        for h in elo_entries
    ]

    achievements.sort(key=lambda a: a.unlocked_at)
    achievements_out = []
    for a in achievements:
        meta = _ACHIEVEMENT_BY_TYPE.get(a.achievement_type, {})
        achievements_out.append(
            {
                "achievement_type": a.achievement_type,
                "name": meta.get("name", a.achievement_type),
                "description": meta.get("description"),
                "rarity": meta.get("rarity"),
                "league_id": a.league_id,
                "unlocked_at": _iso(a.unlocked_at),
            }
        )

    return {
        "export_metadata": {
            "exported_at": datetime.now(UTC).isoformat(),
            "format_version": EXPORT_FORMAT_VERSION,
            "service": "Foosrank",
        },
        "account": {
            "player_id": player.player_id,
            "display_name": player.display_name,
            "email": player.email,
            "created_at": _iso(player.created_at),
            "deleted": player.deleted,
        },
        "stats": {
            "total_matches": player.total_matches,
            "total_wins": player.total_wins,
            "total_losses": player.total_losses,
        },
        "leagues": leagues_out,
        "matches": matches_out,
        "elo_history": elo_history_out,
        "achievements": achievements_out,
        "preferences": {
            "notifications_read_until": player.notifications_read_until,
        },
    }


def delete_user_account(tenant_id: str, cognito_sub: str) -> None:
    """Soft-delete the user: anonymize PlayerModel, propagate label to derived
    records, then remove the Cognito user. Historical matches stay intact.
    """
    player = get_player_by_cognito_sub(tenant_id, cognito_sub)
    if not player:
        raise PlayerNotRegisteredError()

    player_id = player.player_id
    anon_label = f"Deleted player #{player_id[:6]}"
    anon_email = f"deleted-{player_id}@foosrank.local"
    anon_sub = f"deleted-{player_id}"
    now = datetime.now(UTC)

    PlayerModel.update(player.pk, player.sk).set("display_name", anon_label).set(
        "email", anon_email
    ).set("cognito_sub", anon_sub).set("gsi3_pk", anon_email).set("deleted", True).set(
        "deleted_at", now
    ).set("updated_at", now).execute()

    for item in BaseEntity.query(f"TENANT#{tenant_id}").all():
        if isinstance(item, EnrollmentModel) and item.player_id == player_id:
            EnrollmentModel.update(item.pk, item.sk).set(
                "display_name", anon_label
            ).set("updated_at", now).execute()
        elif isinstance(item, RatingModel) and item.player_id == player_id:
            RatingModel.update(item.pk, item.sk).set("display_name", anon_label).set(
                "updated_at", now
            ).execute()

    admin_delete_user(cognito_sub)
    logger.info(f"Anonymized player {player_id} and deleted Cognito user {cognito_sub}")
