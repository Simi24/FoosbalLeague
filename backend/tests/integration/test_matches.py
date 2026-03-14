"""Integration tests for /api/v1/matches endpoints."""


class TestGetMatch:
    """GET /api/v1/matches/{match_id} — match details."""

    def test_returns_seeded_match(self, client):
        resp = client.get("/api/v1/matches/match-001")
        assert resp.status_code == 200
        data = resp.json()
        assert data["match_id"] == "match-001"
        assert data["league_id"] == "league-001"
        assert data["status"] == "CONFIRMED"
        assert data["team1_score"] == 10
        assert data["team2_score"] == 7

    def test_not_found(self, client):
        resp = client.get("/api/v1/matches/nonexistent")
        assert resp.status_code == 404


class TestListMatchesByLeague:
    """GET /api/v1/matches/league/{league_id} — matches for a league."""

    def test_returns_league_matches(self, client):
        resp = client.get("/api/v1/matches/league/league-001")
        assert resp.status_code == 200
        matches = resp.json()
        assert len(matches) >= 4
        for m in matches:
            assert m["league_id"] == "league-001"

    def test_league2_matches(self, client):
        resp = client.get("/api/v1/matches/league/league-002")
        assert resp.status_code == 200
        matches = resp.json()
        assert len(matches) >= 2


class TestRecordMatch:
    """POST /api/v1/matches/ — record a new match."""

    def test_record_pending_match(self, client):
        resp = client.post(
            "/api/v1/matches/",
            json={
                "league_id": "league-002",
                "team1": {"player_ids": ["player-001"], "score": 10},
                "team2": {"player_ids": ["player-002"], "score": 6},
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "PENDING"
        assert data["team1_score"] == 10
        assert data["team2_score"] == 6
        assert data["submitted_by"] == "player-001"
        assert data["match_id"]  # has an ID

        # Verify it's fetchable
        match_id = data["match_id"]
        resp2 = client.get(f"/api/v1/matches/{match_id}")
        assert resp2.status_code == 200
        assert resp2.json()["status"] == "PENDING"


class TestDisputeMatch:
    """POST /api/v1/matches/{match_id}/dispute — dispute pending match."""

    def test_dispute_pending_match(self, client):
        # Create a match to dispute
        resp = client.post(
            "/api/v1/matches/",
            json={
                "league_id": "league-002",
                "team1": {"player_ids": ["player-001"], "score": 10},
                "team2": {"player_ids": ["player-002"], "score": 3},
            },
        )
        match_id = resp.json()["match_id"]

        resp2 = client.post(f"/api/v1/matches/{match_id}/dispute")
        assert resp2.status_code == 200
        assert resp2.json()["status"] == "DISPUTED"


class TestConfirmMatch:
    """POST /api/v1/matches/{match_id}/confirm — confirm + ELO calculation."""

    def test_confirm_match_updates_elo(self, client):
        # Get current ratings before
        resp_before = client.get("/api/v1/rankings/league/league-002")
        leaderboard_before = {
            e["player_id"]: e["elo"] for e in resp_before.json()["entries"]
        }

        # Record a new match
        resp = client.post(
            "/api/v1/matches/",
            json={
                "league_id": "league-002",
                "team1": {"player_ids": ["player-001"], "score": 10},
                "team2": {"player_ids": ["player-002"], "score": 5},
            },
        )
        match_id = resp.json()["match_id"]

        # Confirm it
        resp2 = client.post(f"/api/v1/matches/{match_id}/confirm")
        assert resp2.status_code == 200
        data = resp2.json()
        assert data["status"] == "CONFIRMED"
        assert len(data["elo_changes"]) == 2  # 1v1, 2 players

        # Verify ELO actually changed
        resp_after = client.get("/api/v1/rankings/league/league-002")
        leaderboard_after = {
            e["player_id"]: e["elo"] for e in resp_after.json()["entries"]
        }

        # Winner (player-001) should have gained, loser (player-002) should have lost
        assert leaderboard_after["player-001"] > leaderboard_before["player-001"]
        assert leaderboard_after["player-002"] < leaderboard_before["player-002"]
