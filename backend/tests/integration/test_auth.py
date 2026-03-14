"""Integration tests for /api/v1/auth endpoints."""


class TestGetMe:
    """GET /api/v1/auth/me — returns current user info."""

    def test_returns_user_info(self, client):
        resp = client.get("/api/v1/auth/me")
        assert resp.status_code == 200
        data = resp.json()
        assert data["sub"] == "local-dev-user-001"
        assert data["email"] == "dev@foosball.local"

    def test_includes_player_id_when_registered(self, client):
        """Local dev user is seeded as player-001."""
        resp = client.get("/api/v1/auth/me")
        data = resp.json()
        assert data["player_id"] == "player-001"


class TestRegister:
    """POST /api/v1/auth/register — self-register as player."""

    def test_already_registered_returns_conflict(self, client):
        """Local dev user is already player-001 in seed data."""
        resp = client.post(
            "/api/v1/auth/register",
            json={"display_name": "Duplicate"},
        )
        assert resp.status_code == 409
