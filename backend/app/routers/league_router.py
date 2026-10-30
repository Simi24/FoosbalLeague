from fastapi import APIRouter, Depends, HTTPException

from dependencies.auth import AuthenticatedUser, get_current_user
from dependencies.tenant import get_tenant_id
from schemas.league import (
    CreateLeagueRequest,
    JoinByCodeRequest,
    LeagueMemberResponse,
    LeagueResponse,
    MyLeagueResponse,
    UpdateLeagueRequest,
)
from services.league_service import (
    add_player_to_league,
    create_league,
    delete_league,
    get_enrollment,
    get_league,
    get_league_by_invite_code,
    get_league_members,
    get_player_enrollments,
    join_league,
    kick_player,
    leave_league,
    list_leagues,
    regenerate_invite_code,
    set_member_role,
    update_league,
)
from services.player_service import get_player, get_player_by_cognito_sub
from services.ranking_service import get_leaderboard

router = APIRouter(
    prefix="/api/v1/leagues",
    tags=["leagues"],
)


@router.get("/my", response_model=list[MyLeagueResponse])
async def read_my_leagues(
    user: AuthenticatedUser = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> list[MyLeagueResponse]:
    """List leagues the current player is enrolled in."""
    player = get_player_by_cognito_sub(tenant_id, user.sub)
    if not player:
        return []

    enrollments = get_player_enrollments(tenant_id, player.player_id)
    result: list[MyLeagueResponse] = []
    for enrollment in enrollments:
        league = get_league(tenant_id, enrollment.league_id)
        if not league:
            continue
        result.append(
            MyLeagueResponse(
                league_id=league.league_id,
                name=league.name,
                league_type=league.league_type,
                description=league.description,
                member_count=league.member_count,
                match_count=league.match_count,
                role=enrollment.role,
                current_elo=enrollment.current_elo,
                invite_code=league.invite_code if enrollment.role == "admin" else None,
            )
        )
    return result


@router.get("/", response_model=list[LeagueResponse])
async def read_leagues(
    tenant_id: str = Depends(get_tenant_id),
) -> list[LeagueResponse]:
    """List all leagues in the tenant."""
    leagues = list_leagues(tenant_id)
    return [
        LeagueResponse(
            league_id=lg.league_id,
            name=lg.name,
            league_type=lg.league_type,
            initial_elo=lg.initial_elo,
            description=lg.description,
            tenant_id=tenant_id,
            member_count=lg.member_count,
            match_count=lg.match_count,
        )
        for lg in leagues
    ]


@router.post("/", response_model=LeagueResponse, status_code=201)
async def create_new_league(
    body: CreateLeagueRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> LeagueResponse:
    """Create a new league."""
    league = create_league(
        tenant_id=tenant_id,
        name=body.name,
        league_type=body.league_type,
        initial_elo=body.initial_elo,
        description=body.description,
        created_by=user.sub,
    )

    # Auto-enroll creator as admin
    player = get_player_by_cognito_sub(tenant_id, user.sub)
    if player:
        join_league(
            tenant_id=tenant_id,
            league_id=league.league_id,
            player_id=player.player_id,
            display_name=player.display_name,
            role="admin",
        )
        league = get_league(tenant_id, league.league_id)

    return LeagueResponse(
        league_id=league.league_id,
        name=league.name,
        league_type=league.league_type,
        initial_elo=league.initial_elo,
        description=league.description,
        tenant_id=tenant_id,
        member_count=league.member_count,
        match_count=league.match_count,
    )


@router.get("/{league_id}", response_model=LeagueResponse)
async def read_league(
    league_id: str,
    tenant_id: str = Depends(get_tenant_id),
) -> LeagueResponse:
    """Get league details."""
    league = get_league(tenant_id, league_id)
    if not league:
        raise HTTPException(status_code=404, detail="League not found")

    return LeagueResponse(
        league_id=league.league_id,
        name=league.name,
        league_type=league.league_type,
        initial_elo=league.initial_elo,
        description=league.description,
        tenant_id=tenant_id,
        member_count=league.member_count,
        match_count=league.match_count,
    )


@router.patch("/{league_id}", response_model=LeagueResponse)
async def patch_league(
    league_id: str,
    body: UpdateLeagueRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> LeagueResponse:
    """Update league settings. Admin only."""
    _require_admin(tenant_id, league_id, user)
    league = update_league(
        tenant_id=tenant_id,
        league_id=league_id,
        name=body.name,
        description=body.description,
    )
    if not league:
        raise HTTPException(status_code=404, detail="League not found")

    return LeagueResponse(
        league_id=league.league_id,
        name=league.name,
        league_type=league.league_type,
        initial_elo=league.initial_elo,
        description=league.description,
        tenant_id=tenant_id,
        member_count=league.member_count,
        match_count=league.match_count,
    )


@router.post("/join", status_code=201)
async def join_by_code_endpoint(
    body: JoinByCodeRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Join a league using an invite code."""
    player = get_player_by_cognito_sub(tenant_id, user.sub)
    if not player:
        raise HTTPException(status_code=400, detail="Player not registered")

    league = get_league_by_invite_code(tenant_id, body.code)
    if not league:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    existing = get_enrollment(tenant_id, league.league_id, player.player_id)
    if existing:
        raise HTTPException(status_code=400, detail="Already a member")

    join_league(
        tenant_id=tenant_id,
        league_id=league.league_id,
        player_id=player.player_id,
        display_name=player.display_name,
    )
    return {
        "status": "joined",
        "league_id": league.league_id,
        "league_name": league.name,
    }


@router.post("/{league_id}/leave", status_code=200)
async def leave_league_endpoint(
    league_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Leave a league."""
    player = get_player_by_cognito_sub(tenant_id, user.sub)
    if not player:
        raise HTTPException(status_code=400, detail="Player not registered")

    success = leave_league(tenant_id, league_id, player.player_id)
    if not success:
        raise HTTPException(status_code=404, detail="Not a member of this league")

    return {"status": "left", "league_id": league_id}


@router.get("/{league_id}/members", response_model=list[LeagueMemberResponse])
async def read_league_members(
    league_id: str,
    tenant_id: str = Depends(get_tenant_id),
) -> list[LeagueMemberResponse]:
    """Get all members of a league."""
    league = get_league(tenant_id, league_id)
    if not league:
        raise HTTPException(status_code=404, detail="League not found")

    members = get_league_members(league_id)

    # Use RATING as source of truth for ELO (enrollment current_elo can be stale)
    ratings = get_leaderboard(league_id)
    elo_map = {r.player_id: r.elo for r in ratings}

    return [
        LeagueMemberResponse(
            player_id=m.player_id,
            display_name=m.display_name,
            role=m.role,
            current_elo=elo_map.get(m.player_id, m.current_elo),
        )
        for m in members
    ]


def _require_admin(tenant_id: str, league_id: str, user: AuthenticatedUser) -> None:
    """Validate the current user is an admin of the league."""
    player = get_player_by_cognito_sub(tenant_id, user.sub)
    if not player:
        raise HTTPException(status_code=400, detail="Player not registered")
    enrollment = get_enrollment(tenant_id, league_id, player.player_id)
    if not enrollment or enrollment.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")


@router.delete("/{league_id}", status_code=200)
async def delete_league_endpoint(
    league_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Delete a league and all its data. Admin only."""
    _require_admin(tenant_id, league_id, user)
    success = delete_league(tenant_id, league_id)
    if not success:
        raise HTTPException(status_code=404, detail="League not found")
    return {"status": "deleted", "league_id": league_id}


@router.post("/{league_id}/kick/{player_id}", status_code=200)
async def kick_player_endpoint(
    league_id: str,
    player_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Remove a player from a league. Admin only."""
    _require_admin(tenant_id, league_id, user)
    success = kick_player(tenant_id, league_id, player_id)
    if not success:
        raise HTTPException(status_code=404, detail="Player not in this league")
    return {"status": "kicked", "player_id": player_id}


@router.post("/{league_id}/promote/{player_id}", status_code=200)
async def promote_player_endpoint(
    league_id: str,
    player_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Promote a player to admin. Admin only."""
    _require_admin(tenant_id, league_id, user)
    success = set_member_role(tenant_id, league_id, player_id, "admin")
    if not success:
        raise HTTPException(status_code=404, detail="Player not in this league")
    return {"status": "promoted", "player_id": player_id}


@router.post("/{league_id}/demote/{player_id}", status_code=200)
async def demote_player_endpoint(
    league_id: str,
    player_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Demote an admin to player. Admin only."""
    _require_admin(tenant_id, league_id, user)
    success = set_member_role(tenant_id, league_id, player_id, "player")
    if not success:
        raise HTTPException(status_code=404, detail="Player not in this league")
    return {"status": "demoted", "player_id": player_id}


@router.post("/{league_id}/add/{player_id}", status_code=201)
async def add_player_endpoint(
    league_id: str,
    player_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Add a player to a league. Admin only."""
    _require_admin(tenant_id, league_id, user)
    existing = get_enrollment(tenant_id, league_id, player_id)
    if existing:
        raise HTTPException(status_code=400, detail="Player already in league")
    target = get_player(tenant_id, player_id)
    if not target:
        raise HTTPException(status_code=404, detail="Player not found")
    add_player_to_league(tenant_id, league_id, player_id, target.display_name)
    return {"status": "added", "player_id": player_id}


@router.post("/{league_id}/regenerate-code", status_code=200)
async def regenerate_code_endpoint(
    league_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Regenerate the invite code for a league. Admin only."""
    _require_admin(tenant_id, league_id, user)
    new_code = regenerate_invite_code(tenant_id, league_id)
    if not new_code:
        raise HTTPException(status_code=404, detail="League not found")
    return {"invite_code": new_code}
