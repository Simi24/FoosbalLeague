from typing import Any

from fastapi import APIRouter, Depends

from dependencies.auth import get_current_user
from dependencies.tenant import get_tenant_id
from schemas.auth import RegisterRequest, RegisterResponse, UserInfo
from services.player_service import get_player_by_cognito_sub

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["auth"],
)


@router.get("/me", response_model=UserInfo)
async def get_me(
    user: dict[str, Any] = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> UserInfo:
    """Return current authenticated user info."""
    groups_raw = user.get("cognito:groups", [])
    groups = groups_raw if isinstance(groups_raw, list) else [g for g in groups_raw.split(",") if g] if groups_raw else []

    sub = user.get("sub", "")
    player = get_player_by_cognito_sub(tenant_id, sub) if sub else None

    return UserInfo(
        sub=sub,
        email=user.get("email", ""),
        name=user.get("name", ""),
        groups=groups,
        tenant_id=tenant_id,
        player_id=player.player_id if player else None,
    )


@router.post("/register", response_model=RegisterResponse, status_code=201)
async def register(
    body: RegisterRequest,
    user: dict[str, Any] = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> RegisterResponse:
    """Self-register as a player (creates player from Cognito user)."""
    from services.player_service import create_player

    player = create_player(
        tenant_id=tenant_id,
        cognito_sub=user.get("sub", ""),
        email=user.get("email", ""),
        display_name=body.display_name,
    )
    return RegisterResponse(
        player_id=player.player_id,
        display_name=player.display_name,
        email=player.email,
        tenant_id=tenant_id,
    )
