"""Cognito JWT validation dependency with AuthenticatedUser model and provider pattern."""

import json
import os
import time
from typing import Any, Protocol, runtime_checkable
from urllib.request import urlopen

import jwt
from fastapi import HTTPException, Request
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
COGNITO_REGION = os.getenv("COGNITO_REGION", "eu-west-1")
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "")
IS_LOCAL = os.getenv("LOCAL", "false").lower() == "true"

JWKS_URL = (
    f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/"
    f"{COGNITO_USER_POOL_ID}/.well-known/jwks.json"
)


# ---------------------------------------------------------------------------
# AuthenticatedUser model
# ---------------------------------------------------------------------------
class AuthenticatedUser(BaseModel):
    """Strongly-typed representation of the current authenticated user."""

    sub: str
    email: str
    name: str = ""
    groups: list[str] = Field(default_factory=list)
    tenant_id: str = "default"
    raw_claims: dict[str, Any] = Field(default_factory=dict, exclude=True)

    model_config = {"frozen": True}


# ---------------------------------------------------------------------------
# Claim mapper
# ---------------------------------------------------------------------------
def _cognito_claims_to_user(claims: dict[str, Any]) -> AuthenticatedUser:
    """Map raw Cognito/API-GW claims dict to an AuthenticatedUser."""
    groups_raw = claims.get("cognito:groups", [])
    if isinstance(groups_raw, str):
        groups = [g for g in groups_raw.split(",") if g]
    else:
        groups = list(groups_raw) if groups_raw else []

    return AuthenticatedUser(
        sub=claims.get("sub", ""),
        email=claims.get("email", ""),
        name=claims.get("name", ""),
        groups=groups,
        tenant_id=claims.get("custom:tenant_id", "default"),
        raw_claims=claims,
    )


# ---------------------------------------------------------------------------
# AuthProvider protocol
# ---------------------------------------------------------------------------
@runtime_checkable
class AuthProvider(Protocol):
    """Strategy interface for extracting an authenticated user from a request."""

    async def get_user(self, request: Request) -> AuthenticatedUser: ...


# ---------------------------------------------------------------------------
# CachedJWKSFetcher
# ---------------------------------------------------------------------------
class CachedJWKSFetcher:
    """Fetches and caches JWKS keys with a configurable TTL."""

    def __init__(self, jwks_url: str, ttl: int = 3600) -> None:
        self._jwks_url = jwks_url
        self._ttl = ttl
        self._cache: dict[str, Any] = {}
        self._cache_time: float = 0

    def get_jwks(self) -> dict[str, Any]:
        now = time.time()
        if self._cache and (now - self._cache_time) < self._ttl:
            return self._cache
        with urlopen(self._jwks_url) as response:
            self._cache = json.loads(response.read())
        self._cache_time = now
        return self._cache


# ---------------------------------------------------------------------------
# CognitoJWTProvider (LOCAL / direct JWT validation)
# ---------------------------------------------------------------------------
class CognitoJWTProvider:
    """Validates a Bearer JWT against Cognito JWKS (used in LOCAL mode)."""

    def __init__(self, region: str, user_pool_id: str, jwks_ttl: int = 3600) -> None:
        self._region = region
        self._user_pool_id = user_pool_id
        jwks_url = (
            f"https://cognito-idp.{region}.amazonaws.com/"
            f"{user_pool_id}/.well-known/jwks.json"
        )
        self._fetcher = CachedJWKSFetcher(jwks_url=jwks_url, ttl=jwks_ttl)
        self._issuer = f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}"

    def _decode_token(self, token: str) -> dict[str, Any]:
        jwks = self._fetcher.get_jwks()
        unverified_header = jwt.get_unverified_header(token)

        rsa_key: dict[str, Any] = {}
        for key in jwks.get("keys", []):
            if key["kid"] == unverified_header.get("kid"):
                rsa_key = key
                break

        if not rsa_key:
            raise HTTPException(status_code=401, detail="Unable to find signing key")

        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(rsa_key)
        payload: dict[str, Any] = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            issuer=self._issuer,
            options={"verify_aud": False},
        )
        return payload

    async def get_user(self, request: Request) -> AuthenticatedUser:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing Authorization header")

        token = auth_header.split(" ", 1)[1]
        try:
            claims = self._decode_token(token)
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")

        return _cognito_claims_to_user(claims)


# ---------------------------------------------------------------------------
# APIGatewayAuthorizerProvider (Lambda behind API-GW with JWT authorizer)
# ---------------------------------------------------------------------------
class APIGatewayAuthorizerProvider:
    """Extracts pre-validated claims from the API Gateway authorizer context."""

    async def get_user(self, request: Request) -> AuthenticatedUser:
        event = request.scope.get("aws.event")
        if not event:
            raise HTTPException(
                status_code=401, detail="Missing API Gateway event context"
            )

        claims = (
            event.get("requestContext", {})
            .get("authorizer", {})
            .get("jwt", {})
            .get("claims")
        )
        if not claims:
            raise HTTPException(status_code=401, detail="Missing authorization claims")

        return _cognito_claims_to_user(claims)


# ---------------------------------------------------------------------------
# Provider wiring
# ---------------------------------------------------------------------------
def _get_provider() -> AuthProvider:
    """Return the active auth provider based on environment."""
    if IS_LOCAL:
        return CognitoJWTProvider(
            region=COGNITO_REGION,
            user_pool_id=COGNITO_USER_POOL_ID,
        )
    return APIGatewayAuthorizerProvider()


# Eagerly instantiated so tests can patch it
_active_provider: AuthProvider = _get_provider()


async def get_current_user(
    request: Request,
) -> AuthenticatedUser:
    """Validate JWT / extract claims and return an AuthenticatedUser.

    Signature unchanged for Depends() compatibility.
    """
    provider = _get_provider()
    return await provider.get_user(request)
