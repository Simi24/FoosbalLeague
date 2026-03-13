"""Cognito JWT validation dependency. Bypass for local dev."""

import os
from typing import Any

from fastapi import HTTPException, Request

IS_LOCAL = os.getenv("LOCAL", "false").lower() == "true"

LOCAL_DEV_USER = {
    "sub": "local-dev-user-001",
    "email": "dev@foosball.local",
    "name": "Local Dev",
    "cognito:groups": ["admin"],
}


async def get_current_user(
    request: Request,
) -> dict[str, Any]:
    """Extract pre-validated user claims from API Gateway event context.

    In local dev mode, returns a mock user without token validation.
    """
    if IS_LOCAL:
        return LOCAL_DEV_USER

    event = request.scope.get("aws.event")
    if not event:
        raise HTTPException(status_code=401, detail="Missing API Gateway event context")

    claims = (
        event.get("requestContext", {})
        .get("authorizer", {})
        .get("jwt", {})
        .get("claims")
    )
    if not claims:
        raise HTTPException(status_code=401, detail="Missing authorization claims")

    return claims
