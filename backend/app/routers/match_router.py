from typing import Any

from dependencies.auth import AuthenticatedUser, get_current_user
from dependencies.tenant import get_tenant_id
from fastapi import APIRouter, Depends, HTTPException
from schemas.confirmation import ConfirmationResult
from schemas.match import EloChange, MatchResponse, RecordMatchRequest
from services.exceptions import MatchNotFoundError, MissingRatingsError
from services.league_service import get_enrollment, get_league
from services.match_service import (
    confirm_match,
    dispute_match,
    get_match,
    list_matches_by_league,
    record_match,
)
from services.player_service import get_player_by_cognito_sub

router = APIRouter(
    prefix="/api/v1/matches",
    tags=["matches"],
)


@router.post("/", response_model=MatchResponse, status_code=201)
async def create_match(
    body: RecordMatchRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> MatchResponse:
    """Record a new match result (status=PENDING)."""
    player = get_player_by_cognito_sub(tenant_id, user.sub)
    if not player:
        raise HTTPException(status_code=400, detail="Player not registered")

    # Validate submitter is a member of the league
    submitter_enrollment = get_enrollment(tenant_id, body.league_id, player.player_id)
    if not submitter_enrollment:
        raise HTTPException(
            status_code=403,
            detail="You must be a member of the league to record matches",
        )

    match = record_match(
        tenant_id=tenant_id,
        league_id=body.league_id,
        team1_player_ids=body.team1.player_ids,
        team2_player_ids=body.team2.player_ids,
        team1_score=body.team1.score,
        team2_score=body.team2.score,
        submitted_by=player.player_id,
    )

    return _match_to_response(match)


@router.get("/{match_id}", response_model=MatchResponse)
async def read_match(
    match_id: str,
    tenant_id: str = Depends(get_tenant_id),
) -> MatchResponse:
    """Get match details."""
    match = get_match(tenant_id, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    return _match_to_response(match)


@router.post("/{match_id}/confirm", response_model=MatchResponse)
async def confirm_match_endpoint(
    match_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> MatchResponse:
    """Confirm a pending match.

    The confirmer must be either:
    - A player from the opposing team, OR
    - A player from the losing team, OR
    - A league admin
    """
    player = get_player_by_cognito_sub(tenant_id, user.sub)
    if not player:
        raise HTTPException(status_code=400, detail="Player not registered")

    match = get_match(tenant_id, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # Authorization: opponent player, losing team player, or league admin
    is_opponent = (
        player.player_id in match.team2_player_ids
        and match.submitted_by in match.team1_player_ids
    ) or (
        player.player_id in match.team1_player_ids
        and match.submitted_by in match.team2_player_ids
    )

    is_loser = False
    if player.player_id != match.submitted_by:
        if match.team1_score > match.team2_score:
            is_loser = player.player_id in match.team2_player_ids
        elif match.team2_score > match.team1_score:
            is_loser = player.player_id in match.team1_player_ids

    enrollment = get_enrollment(tenant_id, match.league_id, player.player_id)
    is_admin = enrollment is not None and enrollment.role == "admin"

    if not is_opponent and not is_admin and not is_loser:
        raise HTTPException(
            status_code=403,
            detail="Only an opponent player, losing team player, or league admin can confirm",
        )

    try:
        result = confirm_match(tenant_id, match_id, player.player_id)
    except MatchNotFoundError:
        raise HTTPException(status_code=404, detail="Match not found or not pending")
    except MissingRatingsError:
        raise HTTPException(
            status_code=409,
            detail="Missing player ratings — cannot compute ELO",
        )

    return _confirmation_to_response(result)


@router.post("/{match_id}/dispute", response_model=MatchResponse)
async def dispute_match_endpoint(
    match_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> MatchResponse:
    """Dispute a pending match.

    The disputer must be either:
    - A player involved in the match, OR
    - A league admin
    """
    player = get_player_by_cognito_sub(tenant_id, user.sub)
    if not player:
        raise HTTPException(status_code=400, detail="Player not registered")

    match = get_match(tenant_id, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # Authorization: participant or league admin
    is_participant = (
        player.player_id in match.team1_player_ids
        or player.player_id in match.team2_player_ids
    )

    enrollment = get_enrollment(tenant_id, match.league_id, player.player_id)
    is_admin = enrollment is not None and enrollment.role == "admin"

    if not is_participant and not is_admin:
        raise HTTPException(
            status_code=403,
            detail="Only a match participant or league admin can dispute",
        )

    disputed = dispute_match(tenant_id, match_id, player.player_id)
    if not disputed:
        raise HTTPException(status_code=400, detail="Cannot dispute this match")

    return _match_to_response(disputed)


@router.get("/league/{league_id}", response_model=list[MatchResponse])
async def read_matches_by_league(
    league_id: str,
    tenant_id: str = Depends(get_tenant_id),
) -> list[MatchResponse]:
    """Get matches for a league."""
    league = get_league(tenant_id, league_id)
    if not league:
        raise HTTPException(status_code=404, detail="League not found")

    matches = list_matches_by_league(league_id)
    return [_match_to_response(m) for m in matches]


def _match_to_response(match: Any) -> MatchResponse:
    """Convert MatchModel to MatchResponse."""
    elo_changes = []
    if match.elo_changes:
        for pid, change in match.elo_changes.items():
            if isinstance(change, dict):
                elo_changes.append(
                    EloChange(
                        player_id=pid,
                        display_name="",
                        elo_before=0,
                        elo_after=0,
                        delta=change.get("delta", 0),
                    )
                )

    return MatchResponse(
        match_id=match.match_id,
        league_id=match.league_id,
        team1_player_ids=match.team1_player_ids,
        team2_player_ids=match.team2_player_ids,
        team1_score=match.team1_score,
        team2_score=match.team2_score,
        status=match.status,
        submitted_by=match.submitted_by,
        elo_changes=elo_changes,
        created_at=match.created_at.isoformat()
        if hasattr(match.created_at, "isoformat")
        else str(match.created_at),
    )


def _confirmation_to_response(result: ConfirmationResult) -> MatchResponse:
    """Convert ConfirmationResult to MatchResponse with rich ELO data."""
    elo_changes = [
        EloChange(
            player_id=d.player_id,
            display_name=d.display_name,
            elo_before=d.elo_before,
            elo_after=d.elo_after,
            delta=d.delta,
        )
        for d in result.elo_changes
    ]

    match = result.match
    return MatchResponse(
        match_id=match.match_id,
        league_id=match.league_id,
        team1_player_ids=match.team1_player_ids,
        team2_player_ids=match.team2_player_ids,
        team1_score=match.team1_score,
        team2_score=match.team2_score,
        status=match.status,
        submitted_by=match.submitted_by,
        elo_changes=elo_changes,
        created_at=match.created_at.isoformat()
        if hasattr(match.created_at, "isoformat")
        else str(match.created_at),
    )
