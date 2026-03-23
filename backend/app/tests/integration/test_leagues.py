"""Integration tests for /api/v1/leagues endpoints."""

import uuid


class TestListLeagues:
    """GET /api/v1/leagues/ — list all leagues."""

    def test_returns_seeded_leagues(self, client):
        resp = client.get("/api/v1/leagues/")
        assert resp.status_code == 200
        leagues = resp.json()
        assert len(leagues) >= 2
        names = {lg["name"] for lg in leagues}
        assert "Office Champions 2v2" in names
        assert "1v1 Quick Matches" in names


class TestGetLeague:
    """GET /api/v1/leagues/{league_id} — league details."""

    def test_returns_league(self, client):
        resp = client.get("/api/v1/leagues/league-001")
        assert resp.status_code == 200
        data = resp.json()
        assert data["league_id"] == "league-001"
        assert data["name"] == "Office Champions 2v2"
        assert data["league_type"] == "2v2"
        assert data["member_count"] == 4
        assert data["match_count"] >= 4

    def test_not_found(self, client):
        resp = client.get("/api/v1/leagues/nonexistent")
        assert resp.status_code == 404


class TestMyLeagues:
    """GET /api/v1/leagues/my — leagues current player is enrolled in."""

    def test_returns_enrolled_leagues(self, client):
        resp = client.get("/api/v1/leagues/my")
        assert resp.status_code == 200
        leagues = resp.json()
        league_ids = {lg["league_id"] for lg in leagues}
        # player-001 is enrolled in both leagues
        assert "league-001" in league_ids
        assert "league-002" in league_ids
        # Each entry should have role and current_elo
        for lg in leagues:
            assert "role" in lg
            assert "current_elo" in lg


class TestGetLeagueMembers:
    """GET /api/v1/leagues/{league_id}/members — member list."""

    def test_returns_members(self, client):
        resp = client.get("/api/v1/leagues/league-001/members")
        assert resp.status_code == 200
        members = resp.json()
        assert len(members) >= 4
        player_ids = {m["player_id"] for m in members}
        assert {"player-001", "player-002", "player-003", "player-004"} <= player_ids
        for m in members:
            assert "display_name" in m
            assert "role" in m
            assert "current_elo" in m


class TestCreateLeague:
    """POST /api/v1/leagues/ — create new league."""

    def test_create_and_get(self, client):
        name = f"Test League {uuid.uuid4().hex[:6]}"
        resp = client.post(
            "/api/v1/leagues/",
            json={
                "name": name,
                "league_type": "1v1",
                "initial_elo": 1000,
                "description": "Created by integration test",
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == name
        assert data["league_type"] == "1v1"
        assert data["initial_elo"] == 1000
        league_id = data["league_id"]

        # Verify it's fetchable
        resp2 = client.get(f"/api/v1/leagues/{league_id}")
        assert resp2.status_code == 200
        assert resp2.json()["name"] == name


class TestUpdateLeague:
    """PATCH /api/v1/leagues/{league_id} — update league."""

    def test_update_name(self, client):
        # Create a league to update
        name = f"UpdateMe {uuid.uuid4().hex[:6]}"
        resp = client.post(
            "/api/v1/leagues/",
            json={"name": name, "league_type": "2v2"},
        )
        league_id = resp.json()["league_id"]

        new_name = f"Updated {uuid.uuid4().hex[:6]}"
        resp2 = client.patch(
            f"/api/v1/leagues/{league_id}",
            json={"name": new_name},
        )
        assert resp2.status_code == 200
        assert resp2.json()["name"] == new_name


class TestJoinAndLeaveLeague:
    """POST /api/v1/leagues/{league_id}/join and /leave."""

    def test_join_and_leave_lifecycle(self, client):
        # Create a fresh league
        resp = client.post(
            "/api/v1/leagues/",
            json={"name": f"JoinLeave {uuid.uuid4().hex[:6]}", "league_type": "1v1"},
        )
        league_id = resp.json()["league_id"]

        # player-001 is auto-enrolled as admin on create, so leave first
        resp_leave = client.post(f"/api/v1/leagues/{league_id}/leave")
        assert resp_leave.status_code == 200

        # Rejoin
        resp_join = client.post(f"/api/v1/leagues/{league_id}/join")
        assert resp_join.status_code in (200, 201)

        # Verify membership
        resp_members = client.get(f"/api/v1/leagues/{league_id}/members")
        player_ids = {m["player_id"] for m in resp_members.json()}
        assert "player-001" in player_ids
