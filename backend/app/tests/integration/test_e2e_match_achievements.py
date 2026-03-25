"""E2E test: record a match, confirm via API, verify achievements unlock.

Scenario:
    - Test player (pettasimonepaolo@gmail.com) is seeded as an admin member
      of league-001.
    - Records a 2v2 match where their team wins 10-0 against higher-rated bots.
    - Confirms the match via the API (admin role bypasses opponent check).
    - After confirmation, achievements are verified via the API.

Expected achievements for the test player:
    - first_blood: first win ever
    - shutout: opponent scored 0
    - giant_killer: beat a team with 50+ ELO advantage
"""

from datetime import datetime, timezone

import pytest
from dependencies.auth import AuthenticatedUser, get_current_user
from fastapi.testclient import TestClient
from models.enrollment import EnrollmentModel
from models.player import PlayerModel
from models.rating import RatingModel

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
TENANT_ID = "default"
LEAGUE_ID = "league-001"
TEST_SUB = "test-sub-e2e"
TEST_EMAIL = "pettasimonepaolo@gmail.com"
TEST_DISPLAY_NAME = "Simi25"
TEST_PLAYER_ID = "player-e2e"


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
@pytest.fixture(scope="module")
def _seed_test_player():
    """Seed the test player, enrollment, and rating into DynamoDB once."""
    now = datetime.now(timezone.utc)

    # Player
    PlayerModel(
        pk=f"TENANT#{TENANT_ID}",
        sk=f"PLAYER#{TEST_PLAYER_ID}",
        gsi3_pk=TEST_EMAIL,
        gsi3_sk=f"PLAYER#{TEST_PLAYER_ID}",
        player_id=TEST_PLAYER_ID,
        cognito_sub=TEST_SUB,
        display_name=TEST_DISPLAY_NAME,
        email=TEST_EMAIL,
        created_at=now,
        updated_at=now,
    ).save()

    # Enrollment (admin — so the same user can confirm matches via API)
    EnrollmentModel(
        pk=f"TENANT#{TENANT_ID}",
        sk=f"ENROLL#{LEAGUE_ID}#{TEST_PLAYER_ID}",
        gsi1_pk=f"LEAGUE#{LEAGUE_ID}",
        gsi1_sk=f"ENROLL#{TEST_PLAYER_ID}",
        league_id=LEAGUE_ID,
        player_id=TEST_PLAYER_ID,
        display_name=TEST_DISPLAY_NAME,
        role="admin",
        current_elo=1200,
        created_at=now,
        updated_at=now,
    ).save()

    # Rating (1200 ELO, 0 matches)
    inv_elo = str(9999 - 1200).zfill(4)
    RatingModel(
        pk=f"TENANT#{TENANT_ID}",
        sk=f"RATING#{LEAGUE_ID}#{TEST_PLAYER_ID}",
        gsi1_pk=f"LEAGUE#{LEAGUE_ID}",
        gsi1_sk=f"RATING#{inv_elo}#{TEST_PLAYER_ID}",
        league_id=LEAGUE_ID,
        player_id=TEST_PLAYER_ID,
        display_name=TEST_DISPLAY_NAME,
        elo=1200,
        matches_played=0,
        wins=0,
        losses=0,
        created_at=now,
        updated_at=now,
    ).save()


@pytest.fixture(scope="module")
def client(_seed_test_player):
    """TestClient with auth override → test player."""
    from main import app

    async def _override() -> AuthenticatedUser:
        return AuthenticatedUser(
            sub=TEST_SUB,
            email=TEST_EMAIL,
            name=TEST_DISPLAY_NAME,
            groups=[],
            tenant_id=TENANT_ID,
        )

    app.dependency_overrides[get_current_user] = _override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Tests — run in order within the module
# ---------------------------------------------------------------------------
class TestE2EMatchAndAchievements:
    """Full lifecycle: record → confirm → check achievements."""

    _match_id: str | None = None

    def test_01_record_match(self, client):
        """Test player (team1) + player-003 vs player-001 + player-002 — score 10-0.

        Team1 avg ELO: (1200 + 1140) / 2 = 1170
        Team2 avg ELO: (1280 + 1220) / 2 = 1250
        ELO diff = 80 → giant_killer triggers (>= 50)
        Score 10-0 → shutout triggers
        First win → first_blood triggers
        """
        resp = client.post(
            "/api/v1/matches/",
            json={
                "league_id": LEAGUE_ID,
                "team1": {
                    "player_ids": [TEST_PLAYER_ID, "player-003"],
                    "score": 10,
                },
                "team2": {
                    "player_ids": ["player-001", "player-002"],
                    "score": 0,
                },
            },
        )
        assert resp.status_code == 201, resp.json()
        data = resp.json()
        assert data["status"] == "PENDING"
        assert data["submitted_by"] == TEST_PLAYER_ID
        TestE2EMatchAndAchievements._match_id = data["match_id"]

    def test_02_match_is_pending(self, client):
        """Verify the match exists and is PENDING before confirmation."""
        match_id = TestE2EMatchAndAchievements._match_id
        assert match_id is not None

        resp = client.get(f"/api/v1/matches/{match_id}")
        assert resp.status_code == 200
        assert resp.json()["status"] == "PENDING"

    def test_03_confirm_match_via_api(self, client):
        """Confirm via the API endpoint (test user is admin, so auth passes)."""
        match_id = TestE2EMatchAndAchievements._match_id
        assert match_id is not None

        resp = client.post(f"/api/v1/matches/{match_id}/confirm")
        assert resp.status_code == 200, resp.json()

        data = resp.json()
        assert data["status"] == "CONFIRMED"
        assert len(data["elo_changes"]) == 4  # 2v2 = 4 players

        # Winners (team1) should gain ELO, losers (team2) should lose
        for change in data["elo_changes"]:
            if change["player_id"] in (TEST_PLAYER_ID, "player-003"):
                assert change["delta"] > 0, (
                    f"Winner {change['player_id']} should gain ELO"
                )
            else:
                assert change["delta"] < 0, (
                    f"Loser {change['player_id']} should lose ELO"
                )

    def test_04_match_is_confirmed(self, client):
        """Verify the match is now CONFIRMED via API."""
        match_id = TestE2EMatchAndAchievements._match_id
        resp = client.get(f"/api/v1/matches/{match_id}")
        assert resp.status_code == 200
        assert resp.json()["status"] == "CONFIRMED"

    def test_05_achievements_unlocked(self, client):
        """Verify test player got first_blood, shutout, and giant_killer."""
        resp = client.get(
            f"/api/v1/achievements/player/{TEST_PLAYER_ID}",
            params={"league_id": LEAGUE_ID},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["player_id"] == TEST_PLAYER_ID
        assert data["league_id"] == LEAGUE_ID

        unlocked = {a["type"] for a in data["achievements"] if a["unlocked"]}

        assert "first_blood" in unlocked, "Should unlock first_blood (first win)"
        assert "shutout" in unlocked, "Should unlock shutout (opponent scored 0)"
        assert "giant_killer" in unlocked, (
            "Should unlock giant_killer (beat team with 80 ELO advantage)"
        )

    def test_06_elo_updated_on_leaderboard(self, client):
        """Verify the test player now appears on the leaderboard with updated ELO."""
        resp = client.get(f"/api/v1/rankings/league/{LEAGUE_ID}")
        assert resp.status_code == 200
        entries = resp.json()["entries"]
        test_entry = next(
            (e for e in entries if e["player_id"] == TEST_PLAYER_ID), None
        )
        assert test_entry is not None, "Test player should appear on leaderboard"
        assert test_entry["elo"] > 1200, "ELO should have increased after winning"
        assert test_entry["matches_played"] >= 1
        assert test_entry["wins"] >= 1

    def test_07_bot_player_achievements(self, client):
        """player-003 was also on the winning team — should get first_blood too.

        player-003 had 1W before (from seed data) so first_blood may already exist.
        At minimum, shutout should unlock (first 10-0 win).
        """
        resp = client.get(
            "/api/v1/achievements/player/player-003",
            params={"league_id": LEAGUE_ID},
        )
        assert resp.status_code == 200
        unlocked = {a["type"] for a in resp.json()["achievements"] if a["unlocked"]}
        # player-003 won a 10-0 game, so shutout should be unlocked
        assert "shutout" in unlocked, "player-003 should unlock shutout"
