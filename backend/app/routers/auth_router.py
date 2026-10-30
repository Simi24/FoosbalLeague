import json

from fastapi import APIRouter, Depends, HTTPException, Response

from dependencies.auth import AuthenticatedUser, get_current_user
from dependencies.tenant import get_tenant_id
from schemas.auth import RegisterRequest, RegisterResponse, UserInfo
from services.gdpr_service import delete_user_account, export_user_data
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


@router.get("/me/export")
async def export_my_data(
    user: AuthenticatedUser = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> Response:
    """GDPR art. 15/20: export all personal data as JSON download."""
    data = export_user_data(tenant_id, user.sub)
    payload = json.dumps(data, indent=2, default=str)
    filename = f"foosrank-export-{user.sub[:8]}.json"
    return Response(
        content=payload,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.delete("/me", status_code=204)
async def delete_my_account(
    user: AuthenticatedUser = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> None:
    """GDPR art. 17: anonymize historical data + delete Cognito user."""
    delete_user_account(tenant_id, user.sub)
