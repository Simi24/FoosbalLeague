"""Integration tests for /api/v1/rankings endpoints."""


class TestLeaderboard:
    """GET /api/v1/rankings/league/{league_id} — leaderboard sorted by ELO."""

    def test_returns_sorted_leaderboard(self, client):
        resp = client.get("/api/v1/rankings/league/league-001")
        assert resp.status_code == 200
        data = resp.json()
        assert data["league_id"] == "league-001"
        assert data["league_name"] == "Office Champions 2v2"

        entries = data["entries"]
        assert len(entries) >= 4

        # Verify sorted by ELO descending
        elos = [e["elo"] for e in entries]
        assert elos == sorted(elos, reverse=True)

        # Each entry has the expected fields
        for entry in entries:
            assert "rank" in entry
            assert "player_id" in entry
            assert "display_name" in entry
            assert "elo" in entry
            assert "matches_played" in entry
            assert "wins" in entry
            assert "losses" in entry
            assert "win_rate" in entry

    def test_league2_leaderboard(self, client):
        resp = client.get("/api/v1/rankings/league/league-002")
        assert resp.status_code == 200
        entries = resp.json()["entries"]
        assert len(entries) >= 2


class TestEloHistory:
    """GET /api/v1/rankings/player/{player_id}/history — ELO history."""

    def test_returns_history(self, client):
        resp = client.get(
            "/api/v1/rankings/player/player-001/history",
            params={"league_id": "league-001"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["player_id"] == "player-001"
        assert data["league_id"] == "league-001"
        # History may be empty if no ELO_HISTORY records were seeded
        assert "history" in data
