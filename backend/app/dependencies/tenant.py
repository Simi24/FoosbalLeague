"""Tenant resolution from token or default."""

import os

from dependencies.auth import AuthenticatedUser, get_current_user
from fastapi import Depends

DEFAULT_TENANT_ID = os.getenv("DEFAULT_TENANT_ID", "default")


async def get_tenant_id(
    user: AuthenticatedUser = Depends(get_current_user),
) -> str:
    """Resolve tenant ID from user token claims or fallback to default."""
    return user.tenant_id or DEFAULT_TENANT_ID
