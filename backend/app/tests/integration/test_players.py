"""Integration tests for /api/v1/players endpoints."""


class TestListPlayers:
    """GET /api/v1/players/ — list all players in tenant."""

    def test_returns_seeded_players(self, client):
        resp = client.get("/api/v1/players/")
        assert resp.status_code == 200
        players = resp.json()
        assert len(players) >= 4
        names = {p["display_name"] for p in players}
        assert {"Local Dev", "Alice Spin", "Bob Striker", "Carol Goalie"} <= names


class TestGetPlayer:
    """GET /api/v1/players/{player_id} — get player profile."""

    def test_returns_player(self, client):
        resp = client.get("/api/v1/players/player-001")
        assert resp.status_code == 200
        data = resp.json()
        assert data["player_id"] == "player-001"
        assert data["display_name"] == "Local Dev"
        assert data["email"] == "dev@foosball.local"

    def test_not_found(self, client):
        resp = client.get("/api/v1/players/nonexistent")
        assert resp.status_code == 404


class TestGetPlayerStats:
    """GET /api/v1/players/{player_id}/stats — aggregated stats."""

    def test_returns_stats(self, client):
        resp = client.get("/api/v1/players/player-001/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert data["player_id"] == "player-001"
        assert "total_matches" in data
        assert "total_wins" in data
        assert "total_losses" in data
        assert "win_rate" in data
        assert "leagues" in data

    def test_not_found(self, client):
        resp = client.get("/api/v1/players/nonexistent/stats")
        assert resp.status_code == 404
