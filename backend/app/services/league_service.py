"""League service - business logic for league operations."""

import uuid
from datetime import datetime, timezone
from typing import Literal

from libs.commons.logging import logger
from models.base import BaseEntity
from models.enrollment import EnrollmentModel
from models.league import LeagueModel
from models.rating import RatingModel


def create_league(
    tenant_id: str,
    name: str,
    league_type: Literal["1v1", "2v2"],
    initial_elo: int,
    description: str,
    created_by: str,
) -> LeagueModel:
    """Create a new league."""
    league_id = str(uuid.uuid4())[:8]
    invite_code = str(uuid.uuid4())[:6].upper()
    now = datetime.now(timezone.utc)

    league = LeagueModel(
        pk=f"TENANT#{tenant_id}",
        sk=f"LEAGUE#{league_id}",
        gsi1_pk=f"LEAGUE#{league_id}",
        gsi1_sk=f"LEAGUE#{league_id}",
        league_id=league_id,
        name=name,
        league_type=league_type,
        initial_elo=initial_elo,
        description=description,
        created_by=created_by,
        invite_code=invite_code,
        created_at=now,
        updated_at=now,
    )
    league.save()
    logger.info(f"Created league {league_id} ({name}) with invite code {invite_code}")
    return league


def get_league_by_invite_code(tenant_id: str, code: str) -> LeagueModel | None:
    """Find a league by its invite code."""
    leagues = list_leagues(tenant_id)
    for league in leagues:
        if league.invite_code == code.upper():
            return league
    return None


def regenerate_invite_code(tenant_id: str, league_id: str) -> str | None:
    """Generate a new invite code for a league."""
    league = get_league(tenant_id, league_id)
    if not league:
        return None

    new_code = str(uuid.uuid4())[:6].upper()
    now = datetime.now(timezone.utc)
    LeagueModel.update(league.pk, league.sk).set(
        "invite_code", new_code
    ).set("updated_at", now).execute()

    logger.info(f"Regenerated invite code for league {league_id}: {new_code}")
    return new_code


def get_league(tenant_id: str, league_id: str) -> LeagueModel | None:
    """Get league by ID."""
    result = BaseEntity.get(f"TENANT#{tenant_id}", f"LEAGUE#{league_id}")
    if result and isinstance(result, LeagueModel):
        return result
    return None


def list_leagues(tenant_id: str) -> list[LeagueModel]:
    """List all leagues in a tenant."""
    results = BaseEntity.query(f"TENANT#{tenant_id}").starts_with("LEAGUE#").all()
    return [item for item in results if isinstance(item, LeagueModel)]


def update_league(
    tenant_id: str,
    league_id: str,
    name: str | None = None,
    description: str | None = None,
) -> LeagueModel | None:
    """Update league settings."""
    league = get_league(tenant_id, league_id)
    if not league:
        return None

    updates = {}
    if name is not None:
        updates["name"] = name
    if description is not None:
        updates["description"] = description

    if updates:
        updates["updated_at"] = datetime.now(timezone.utc)
        builder = LeagueModel.update(league.pk, league.sk)
        for field, value in updates.items():
            builder = builder.set(field, value)
        builder.execute()
        return get_league(tenant_id, league_id)

    return league


def join_league(
    tenant_id: str,
    league_id: str,
    player_id: str,
    display_name: str,
    role: Literal["player", "admin"] = "player",
) -> EnrollmentModel:
    """Join a league (create enrollment + initial rating)."""
    league = get_league(tenant_id, league_id)
    if not league:
        raise ValueError(f"League {league_id} not found")

    now = datetime.now(timezone.utc)
    initial_elo = league.initial_elo

    # Create enrollment
    enrollment = EnrollmentModel(
        pk=f"TENANT#{tenant_id}",
        sk=f"ENROLL#{league_id}#{player_id}",
        gsi1_pk=f"LEAGUE#{league_id}",
        gsi1_sk=f"ENROLL#{player_id}",
        league_id=league_id,
        player_id=player_id,
        display_name=display_name,
        role=role,
        current_elo=initial_elo,
        created_at=now,
        updated_at=now,
    )
    enrollment.save()

    # Create initial rating
    inverted_elo = str(9999 - initial_elo).zfill(4)
    rating = RatingModel(
        pk=f"TENANT#{tenant_id}",
        sk=f"RATING#{league_id}#{player_id}",
        gsi1_pk=f"LEAGUE#{league_id}",
        gsi1_sk=f"RATING#{inverted_elo}#{player_id}",
        league_id=league_id,
        player_id=player_id,
        display_name=display_name,
        elo=initial_elo,
        created_at=now,
        updated_at=now,
    )
    rating.save()

    # Increment member count
    LeagueModel.update(league.pk, league.sk).set(
        "member_count", league.member_count + 1
    ).set("updated_at", now).execute()

    logger.info(f"Player {player_id} joined league {league_id}")
    return enrollment


def leave_league(tenant_id: str, league_id: str, player_id: str) -> bool:
    """Leave a league (delete enrollment)."""
    enrollment = BaseEntity.get(
        f"TENANT#{tenant_id}", f"ENROLL#{league_id}#{player_id}"
    )
    if not enrollment:
        return False

    EnrollmentModel.delete(enrollment.pk, enrollment.sk)

    league = get_league(tenant_id, league_id)
    if league:
        now = datetime.now(timezone.utc)
        LeagueModel.update(league.pk, league.sk).set(
            "member_count", max(0, league.member_count - 1)
        ).set("updated_at", now).execute()

    logger.info(f"Player {player_id} left league {league_id}")
    return True


def get_league_members(league_id: str) -> list[EnrollmentModel]:
    """Get all members of a league via GSI1."""
    results = (
        BaseEntity.query_index("GSI1", f"LEAGUE#{league_id}")
        .starts_with("ENROLL#")
        .all()
    )
    return [item for item in results if isinstance(item, EnrollmentModel)]


def get_player_enrollments(
    tenant_id: str, player_id: str
) -> list[EnrollmentModel]:
    """Get all enrollments for a player across leagues."""
    results = BaseEntity.query(f"TENANT#{tenant_id}").starts_with("ENROLL#").all()
    return [
        item
        for item in results
        if isinstance(item, EnrollmentModel) and item.player_id == player_id
    ]


def kick_player(tenant_id: str, league_id: str, player_id: str) -> bool:
    """Remove a player from a league (admin action). Same as leave but admin-initiated."""
    return leave_league(tenant_id, league_id, player_id)


def set_member_role(
    tenant_id: str,
    league_id: str,
    player_id: str,
    role: Literal["player", "admin"],
) -> bool:
    """Change a member's role."""
    enrollment = BaseEntity.get(
        f"TENANT#{tenant_id}", f"ENROLL#{league_id}#{player_id}"
    )
    if not enrollment or not isinstance(enrollment, EnrollmentModel):
        return False

    now = datetime.now(timezone.utc)
    EnrollmentModel.update(enrollment.pk, enrollment.sk).set(
        "role", role
    ).set("updated_at", now).execute()

    logger.info(f"Player {player_id} role set to {role} in league {league_id}")
    return True


def delete_league(tenant_id: str, league_id: str) -> bool:
    """Delete a league and all associated data."""
    league = get_league(tenant_id, league_id)
    if not league:
        return False

    # Delete all enrollments
    for enrollment in get_league_members(league_id):
        EnrollmentModel.delete(enrollment.pk, enrollment.sk)

    # Delete all ratings
    ratings = (
        BaseEntity.query_index("GSI1", f"LEAGUE#{league_id}")
        .starts_with("RATING#")
        .all()
    )
    for r in ratings:
        if isinstance(r, RatingModel):
            RatingModel.delete(r.pk, r.sk)

    # Delete league
    LeagueModel.delete(league.pk, league.sk)

    logger.info(f"Deleted league {league_id} and all associated data")
    return True


def add_player_to_league(
    tenant_id: str,
    league_id: str,
    player_id: str,
    display_name: str,
) -> EnrollmentModel:
    """Admin adds a player to a league."""
    return join_league(tenant_id, league_id, player_id, display_name, role="player")


def get_enrollment(
    tenant_id: str, league_id: str, player_id: str
) -> EnrollmentModel | None:
    """Get specific enrollment."""
    result = BaseEntity.get(
        f"TENANT#{tenant_id}", f"ENROLL#{league_id}#{player_id}"
    )
    if result and isinstance(result, EnrollmentModel):
        return result
    return None
