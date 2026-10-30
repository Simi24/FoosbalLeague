from fastapi import APIRouter, Depends, HTTPException

from dependencies.auth import AuthenticatedUser, get_current_user
from dependencies.tenant import get_tenant_id
from services.tenant_service import get_tenant

router = APIRouter(
    prefix="/api/v1/admin",
    tags=["admin"],
)


@router.get("/tenant")
async def read_tenant(
    user: AuthenticatedUser = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Get tenant settings."""
    tenant = get_tenant(tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    return {
        "tenant_id": tenant.tenant_id,
        "name": tenant.name,
        "settings": tenant.settings,
    }
