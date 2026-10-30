"""Tests for auth dependency refactor: AuthenticatedUser, providers, claim mapper."""

import asyncio
import os

os.environ.setdefault("ENV", "local")
os.environ.setdefault("LOCAL", "true")

from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from pydantic import ValidationError

from dependencies.auth import (
    APIGatewayAuthorizerProvider,
    AuthenticatedUser,
    CachedJWKSFetcher,
    CognitoJWTProvider,
    _cognito_claims_to_user,
    get_current_user,
)


def _run(coro):
    """Helper to run an async coroutine synchronously."""
    return asyncio.get_event_loop().run_until_complete(coro)


# ---------------------------------------------------------------------------
# AuthenticatedUser model tests
# ---------------------------------------------------------------------------
class TestAuthenticatedUser:
    """AuthenticatedUser Pydantic model behaviour."""

    def test_minimal_creation(self) -> None:
        """User can be created with just sub and email."""
        user = AuthenticatedUser(sub="abc-123", email="a@b.com")
        assert user.sub == "abc-123"
        assert user.email == "a@b.com"
        assert user.name == ""
        assert user.groups == []
        assert user.tenant_id == "default"
        assert user.raw_claims == {}

    def test_full_creation(self) -> None:
        """User can be created with all fields."""
        user = AuthenticatedUser(
            sub="abc-123",
            email="a@b.com",
            name="Alice",
            groups=["admin"],
            tenant_id="tenant-1",
            raw_claims={"custom:foo": "bar"},
        )
        assert user.name == "Alice"
        assert user.groups == ["admin"]
        assert user.tenant_id == "tenant-1"
        assert user.raw_claims == {"custom:foo": "bar"}

    def test_raw_claims_excluded_from_serialization(self) -> None:
        """raw_claims must NOT appear in model_dump / JSON output."""
        user = AuthenticatedUser(
            sub="abc-123",
            email="a@b.com",
            raw_claims={"secret": "value"},
        )
        data = user.model_dump()
        assert "raw_claims" not in data

    def test_immutability(self) -> None:
        """AuthenticatedUser should be frozen (immutable)."""
        user = AuthenticatedUser(sub="abc-123", email="a@b.com")
        with pytest.raises(ValidationError):
            user.sub = "new-sub"  # type: ignore[misc]


# ---------------------------------------------------------------------------
# _cognito_claims_to_user mapper tests
# ---------------------------------------------------------------------------
class TestCognitoClaimsToUser:
    """Centralised claim-to-user mapper."""

    def test_basic_mapping(self) -> None:
        claims: dict[str, Any] = {
            "sub": "user-1",
            "email": "user@example.com",
            "name": "User One",
            "custom:tenant_id": "t-42",
            "cognito:groups": ["players"],
        }
        user = _cognito_claims_to_user(claims)
        assert user.sub == "user-1"
        assert user.email == "user@example.com"
        assert user.name == "User One"
        assert user.tenant_id == "t-42"
        assert user.groups == ["players"]
        assert user.raw_claims == claims

    def test_missing_optional_fields_defaults(self) -> None:
        claims: dict[str, Any] = {"sub": "user-2", "email": "u@b.com"}
        user = _cognito_claims_to_user(claims)
        assert user.name == ""
        assert user.groups == []
        assert user.tenant_id == "default"

    def test_groups_as_csv_string(self) -> None:
        """API Gateway may serialize groups as a comma-separated string."""
        claims: dict[str, Any] = {
            "sub": "user-3",
            "email": "u@c.com",
            "cognito:groups": "admin,players",
        }
        user = _cognito_claims_to_user(claims)
        assert user.groups == ["admin", "players"]

    def test_groups_empty_string(self) -> None:
        claims: dict[str, Any] = {
            "sub": "user-4",
            "email": "u@d.com",
            "cognito:groups": "",
        }
        user = _cognito_claims_to_user(claims)
        assert user.groups == []


# ---------------------------------------------------------------------------
# CachedJWKSFetcher tests
# ---------------------------------------------------------------------------
class TestCachedJWKSFetcher:
    """JWKS caching behaviour."""

    def test_fetches_and_caches(self) -> None:
        mock_jwks = {"keys": [{"kid": "k1", "kty": "RSA"}]}
        fetcher = CachedJWKSFetcher(
            jwks_url="https://example.com/.well-known/jwks.json",
        )

        with patch("dependencies.auth.urlopen") as mock_urlopen:
            mock_resp = MagicMock()
            mock_resp.read.return_value = b'{"keys": [{"kid": "k1", "kty": "RSA"}]}'
            mock_resp.__enter__ = lambda s: s
            mock_resp.__exit__ = MagicMock(return_value=False)
            mock_urlopen.return_value = mock_resp

            result = fetcher.get_jwks()
            assert result == mock_jwks

            # Second call should use cache (no additional urlopen call)
            result2 = fetcher.get_jwks()
            assert result2 == mock_jwks
            assert mock_urlopen.call_count == 1

    def test_cache_expiry(self) -> None:
        fetcher = CachedJWKSFetcher(
            jwks_url="https://example.com/.well-known/jwks.json",
            ttl=0,  # Instant expiry
        )
        with patch("dependencies.auth.urlopen") as mock_urlopen:
            mock_resp = MagicMock()
            mock_resp.read.return_value = b'{"keys": []}'
            mock_resp.__enter__ = lambda s: s
            mock_resp.__exit__ = MagicMock(return_value=False)
            mock_urlopen.return_value = mock_resp

            fetcher.get_jwks()
            fetcher.get_jwks()
            assert mock_urlopen.call_count == 2


# ---------------------------------------------------------------------------
# CognitoJWTProvider tests
# ---------------------------------------------------------------------------
class TestCognitoJWTProvider:
    """CognitoJWTProvider extracts user from Bearer token."""

    def test_missing_authorization_header(self) -> None:
        from fastapi import HTTPException

        request = MagicMock()
        request.headers = {}
        provider = CognitoJWTProvider(
            region="eu-west-1",
            user_pool_id="pool-1",
        )
        with pytest.raises(HTTPException) as exc_info:
            _run(provider.get_user(request))
        assert exc_info.value.status_code == 401
        assert "Missing" in exc_info.value.detail

    def test_invalid_auth_scheme(self) -> None:
        from fastapi import HTTPException

        request = MagicMock()
        request.headers = {"Authorization": "Basic abc123"}
        provider = CognitoJWTProvider(
            region="eu-west-1",
            user_pool_id="pool-1",
        )
        with pytest.raises(HTTPException) as exc_info:
            _run(provider.get_user(request))
        assert exc_info.value.status_code == 401

    def test_valid_token_returns_authenticated_user(self) -> None:
        claims = {
            "sub": "u-1",
            "email": "u@test.com",
            "name": "Test",
            "cognito:groups": ["g1"],
            "custom:tenant_id": "t-1",
        }
        request = MagicMock()
        request.headers = {"Authorization": "Bearer fake-token"}

        provider = CognitoJWTProvider(
            region="eu-west-1",
            user_pool_id="pool-1",
        )

        with patch.object(provider, "_decode_token", return_value=claims):
            user = _run(provider.get_user(request))

        assert isinstance(user, AuthenticatedUser)
        assert user.sub == "u-1"
        assert user.email == "u@test.com"
        assert user.tenant_id == "t-1"


# ---------------------------------------------------------------------------
# APIGatewayAuthorizerProvider tests
# ---------------------------------------------------------------------------
class TestAPIGatewayAuthorizerProvider:
    """Provider that extracts claims from API Gateway event context."""

    def test_missing_event(self) -> None:
        from fastapi import HTTPException

        request = MagicMock()
        request.scope = {}
        provider = APIGatewayAuthorizerProvider()
        with pytest.raises(HTTPException) as exc_info:
            _run(provider.get_user(request))
        assert exc_info.value.status_code == 401

    def test_missing_claims(self) -> None:
        from fastapi import HTTPException

        request = MagicMock()
        request.scope = {"aws.event": {"requestContext": {}}}
        provider = APIGatewayAuthorizerProvider()
        with pytest.raises(HTTPException) as exc_info:
            _run(provider.get_user(request))
        assert exc_info.value.status_code == 401

    def test_valid_claims(self) -> None:
        request = MagicMock()
        request.scope = {
            "aws.event": {
                "requestContext": {
                    "authorizer": {
                        "jwt": {
                            "claims": {
                                "sub": "gw-user",
                                "email": "gw@test.com",
                                "name": "GW User",
                                "custom:tenant_id": "t-gw",
                                "cognito:groups": "admins,players",
                            }
                        }
                    }
                }
            }
        }
        provider = APIGatewayAuthorizerProvider()
        user = _run(provider.get_user(request))
        assert isinstance(user, AuthenticatedUser)
        assert user.sub == "gw-user"
        assert user.tenant_id == "t-gw"
        assert user.groups == ["admins", "players"]


# ---------------------------------------------------------------------------
# get_current_user integration tests
# ---------------------------------------------------------------------------
class TestGetCurrentUser:
    """get_current_user delegates to the correct provider."""

    def test_local_mode_returns_authenticated_user(self) -> None:
        """In LOCAL mode, get_current_user should return AuthenticatedUser."""
        claims = {
            "sub": "local-user",
            "email": "local@test.com",
            "name": "Local",
            "custom:tenant_id": "t-local",
        }
        request = MagicMock()
        request.headers = {"Authorization": "Bearer fake"}

        expected_user = _cognito_claims_to_user(claims)
        mock_provider = MagicMock()
        mock_provider.get_user = AsyncMock(return_value=expected_user)

        with patch(
            "dependencies.auth._get_provider",
            return_value=mock_provider,
        ):
            user = _run(get_current_user(request))

        assert isinstance(user, AuthenticatedUser)
        assert user.sub == "local-user"
        assert user.tenant_id == "t-local"

    def test_gateway_mode_returns_authenticated_user(self) -> None:
        """In non-LOCAL mode, get_current_user delegates to gateway provider."""
        claims = {
            "sub": "gw-user",
            "email": "gw@test.com",
        }
        request = MagicMock()
        request.scope = {
            "aws.event": {"requestContext": {"authorizer": {"jwt": {"claims": claims}}}}
        }

        expected_user = _cognito_claims_to_user(claims)
        mock_provider = MagicMock()
        mock_provider.get_user = AsyncMock(return_value=expected_user)

        with patch(
            "dependencies.auth._get_provider",
            return_value=mock_provider,
        ):
            user = _run(get_current_user(request))

        assert isinstance(user, AuthenticatedUser)
        assert user.sub == "gw-user"


# ---------------------------------------------------------------------------
# Tenant dependency compatibility test
# ---------------------------------------------------------------------------
class TestTenantDependencyCompat:
    """Ensure tenant.py works with new AuthenticatedUser."""

    def test_get_tenant_id_from_authenticated_user(self) -> None:
        from dependencies.tenant import get_tenant_id

        user = AuthenticatedUser(
            sub="t-user",
            email="t@test.com",
            tenant_id="my-tenant",
        )
        tenant_id = _run(get_tenant_id(user))
        assert tenant_id == "my-tenant"

    def test_get_tenant_id_default(self) -> None:
        from dependencies.tenant import get_tenant_id

        user = AuthenticatedUser(sub="u", email="u@x.com")
        tenant_id = _run(get_tenant_id(user))
        assert tenant_id == "default"
