"""Tenant resolution from token or default."""

import os
from typing import Any

from fastapi import Depends

from dependencies.auth import get_current_user

DEFAULT_TENANT_ID = os.getenv("DEFAULT_TENANT_ID", "default")


async def get_tenant_id(
    user: dict[str, Any] = Depends(get_current_user),
) -> str:
    """Resolve tenant ID from user token claims or fallback to default."""
    return user.get("custom:tenant_id", DEFAULT_TENANT_ID)
