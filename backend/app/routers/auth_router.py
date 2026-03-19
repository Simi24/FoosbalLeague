from dependencies.auth import AuthenticatedUser, get_current_user
from dependencies.tenant import get_tenant_id
from fastapi import APIRouter, Depends, HTTPException
from schemas.auth import RegisterRequest, RegisterResponse, UserInfo
from services.player_service import get_player_by_cognito_sub

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["auth"],
)


@router.get("/me", response_model=UserInfo)
async def get_me(
    user: AuthenticatedUser = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> UserInfo:
    """Return current authenticated user info."""
    player = get_player_by_cognito_sub(tenant_id, user.sub) if user.sub else None

    return UserInfo(
        sub=user.sub,
        email=user.email,
        name=user.name,
        groups=user.groups,
        tenant_id=tenant_id,
        player_id=player.player_id if player else None,
    )


@router.post("/register", response_model=RegisterResponse, status_code=201)
async def register(
    body: RegisterRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> RegisterResponse:
    """Self-register as a player (creates player from Cognito user)."""
    from services.player_service import create_player

    existing = get_player_by_cognito_sub(tenant_id, user.sub)
    if existing:
        raise HTTPException(status_code=409, detail="Player already registered")

    player = create_player(
        tenant_id=tenant_id,
        cognito_sub=user.sub,
        email=user.email,
        display_name=body.display_name,
    )
    return RegisterResponse(
        player_id=player.player_id,
        display_name=player.display_name,
        email=player.email,
        tenant_id=tenant_id,
    )
