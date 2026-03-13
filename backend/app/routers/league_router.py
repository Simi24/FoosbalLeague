from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from dependencies.auth import get_current_user
from dependencies.tenant import get_tenant_id
from schemas.league import (
    CreateLeagueRequest,
    LeagueMemberResponse,
    LeagueResponse,
    UpdateLeagueRequest,
)
from services.league_service import (
    create_league,
    get_enrollment,
    get_league,
    get_league_members,
    join_league,
    leave_league,
    list_leagues,
    update_league,
)
from services.player_service import get_player_by_cognito_sub

router = APIRouter(
    prefix="/api/v1/leagues",
    tags=["leagues"],
)


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
    user: dict[str, Any] = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> LeagueResponse:
    """Create a new league."""
    league = create_league(
        tenant_id=tenant_id,
        name=body.name,
        league_type=body.league_type,
        initial_elo=body.initial_elo,
        description=body.description,
        created_by=user.get("sub", ""),
    )
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
    user: dict[str, Any] = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> LeagueResponse:
    """Update league settings."""
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


@router.post("/{league_id}/join", status_code=201)
async def join_league_endpoint(
    league_id: str,
    user: dict[str, Any] = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Join a league."""
    player = get_player_by_cognito_sub(tenant_id, user.get("sub", ""))
    if not player:
        raise HTTPException(status_code=400, detail="Player not registered")

    existing = get_enrollment(tenant_id, league_id, player.player_id)
    if existing:
        raise HTTPException(status_code=400, detail="Already a member")

    enrollment = join_league(
        tenant_id=tenant_id,
        league_id=league_id,
        player_id=player.player_id,
        display_name=player.display_name,
    )
    return {"status": "joined", "league_id": league_id, "player_id": player.player_id}


@router.post("/{league_id}/leave", status_code=200)
async def leave_league_endpoint(
    league_id: str,
    user: dict[str, Any] = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Leave a league."""
    player = get_player_by_cognito_sub(tenant_id, user.get("sub", ""))
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
    members = get_league_members(league_id)
    return [
        LeagueMemberResponse(
            player_id=m.player_id,
            display_name=m.display_name,
            role=m.role,
            current_elo=m.current_elo,
        )
        for m in members
    ]
