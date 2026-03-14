"""Cognito JWT validation dependency."""

import os
import json
import time
from typing import Any
from urllib.request import urlopen

import jwt
from fastapi import HTTPException, Request

COGNITO_REGION = os.getenv("COGNITO_REGION", "eu-west-1")
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "")
IS_LOCAL = os.getenv("LOCAL", "false").lower() == "true"

JWKS_URL = (
    f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/"
    f"{COGNITO_USER_POOL_ID}/.well-known/jwks.json"
)

_jwks_cache: dict[str, Any] = {}
_jwks_cache_time: float = 0
JWKS_CACHE_TTL = 3600


def _get_jwks() -> dict[str, Any]:
    global _jwks_cache, _jwks_cache_time
    now = time.time()
    if _jwks_cache and (now - _jwks_cache_time) < JWKS_CACHE_TTL:
        return _jwks_cache
    with urlopen(JWKS_URL) as response:
        _jwks_cache = json.loads(response.read())
    _jwks_cache_time = now
    return _jwks_cache


def _decode_token(token: str) -> dict[str, Any]:
    jwks = _get_jwks()
    unverified_header = jwt.get_unverified_header(token)

    rsa_key: dict[str, Any] = {}
    for key in jwks.get("keys", []):
        if key["kid"] == unverified_header.get("kid"):
            rsa_key = key
            break

    if not rsa_key:
        raise HTTPException(status_code=401, detail="Unable to find signing key")

    issuer = (
        f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}"
    )

    public_key = jwt.algorithms.RSAAlgorithm.from_jwk(rsa_key)
    payload: dict[str, Any] = jwt.decode(
        token,
        public_key,
        algorithms=["RS256"],
        issuer=issuer,
        options={"verify_aud": False},
    )
    return payload


async def get_current_user(
    request: Request,
) -> dict[str, Any]:
    """Validate JWT from Authorization header or extract from API Gateway context."""
    if IS_LOCAL:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing Authorization header")

        token = auth_header.split(" ", 1)[1]
        try:
            claims = _decode_token(token)
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

        return claims

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
