"""Security tests — tenant isolation & authorization checks.

Unit tests using TestClient with mocked auth dependency.
"""

from contextlib import ExitStack
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest
from dependencies.auth import AuthenticatedUser
from fastapi.testclient import TestClient


@pytest.fixture()
def user_tenant_a() -> AuthenticatedUser:
    return AuthenticatedUser(
        sub="user-a",
        email="a@test.com",
        name="User A",
        tenant_id="tenant-a",
    )


@pytest.fixture()
def client(user_tenant_a: AuthenticatedUser):
    """TestClient with mocked auth returning tenant-a user."""
    from dependencies.auth import get_current_user
    from main import app

    async def _override() -> AuthenticatedUser:
        return user_tenant_a

    app.dependency_overrides[get_current_user] = _override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _make_match_mock(
    match_id: str = "m1",
    league_id: str = "lg1",
    team1: list[str] | None = None,
    team2: list[str] | None = None,
    submitted_by: str = "p1",
    status: str = "PENDING",
    team1_score: int = 10,
    team2_score: int = 7,
) -> MagicMock:
    m = MagicMock()
    m.match_id = match_id
    m.league_id = league_id
    m.team1_player_ids = team1 or ["p1"]
    m.team2_player_ids = team2 or ["p2"]
    m.submitted_by = submitted_by
    m.status = status
    m.team1_score = team1_score
    m.team2_score = team2_score
    m.elo_changes = None
    m.created_at = datetime.now(timezone.utc)
    return m


def _make_confirmation_result_mock(match: MagicMock) -> MagicMock:
    from schemas.confirmation import ConfirmationResult

    result = MagicMock(spec=ConfirmationResult)
    result.match = match
    result.elo_changes = []
    result.newly_unlocked = []
    return result


def _make_player_mock(player_id: str = "p-ext") -> MagicMock:
    p = MagicMock()
    p.player_id = player_id
    return p


def _make_enrollment_mock(role: str = "player") -> MagicMock:
    e = MagicMock()
    e.role = role
    return e


# ---------------------------------------------------------------------------
# Tenant isolation
# ---------------------------------------------------------------------------
class TestTenantIsolationMatchListing:
    """GET /api/v1/matches/league/{league_id} must validate league ownership."""

    def test_returns_404_when_league_not_in_tenant(self, client: TestClient) -> None:
        with patch("routers.match_router.get_league", return_value=None) as mock_gl:
            resp = client.get("/api/v1/matches/league/foreign-league-id")
            assert resp.status_code == 404
            assert "not found" in resp.json()["detail"].lower()
            mock_gl.assert_called_once_with("tenant-a", "foreign-league-id")

    def test_returns_matches_when_league_in_tenant(self, client: TestClient) -> None:
        mock_league = MagicMock(league_id="my-league")
        with (
            patch("routers.match_router.get_league", return_value=mock_league),
            patch(
                "routers.match_router.list_matches_by_league", return_value=[]
            ) as mock_lm,
        ):
            resp = client.get("/api/v1/matches/league/my-league")
            assert resp.status_code == 200
            mock_lm.assert_called_once_with("my-league")


class TestTenantIsolationLeagueMembers:
    """GET /api/v1/leagues/{league_id}/members must validate league ownership."""

    def test_returns_404_when_league_not_in_tenant(self, client: TestClient) -> None:
        with patch("routers.league_router.get_league", return_value=None) as mock_gl:
            resp = client.get("/api/v1/leagues/foreign-league-id/members")
            assert resp.status_code == 404
            assert "not found" in resp.json()["detail"].lower()
            mock_gl.assert_called_once_with("tenant-a", "foreign-league-id")


# ---------------------------------------------------------------------------
# Match dispute authorization
# ---------------------------------------------------------------------------
class TestDisputeAuthorization:
    """POST /api/v1/matches/{match_id}/dispute must check participant/admin."""

    def test_non_participant_non_admin_gets_403(self, client: TestClient) -> None:
        """A user who is not in the match and not league admin cannot dispute."""
        match = _make_match_mock(team1=["p1"], team2=["p2"], submitted_by="p1")
        player = _make_player_mock("outsider")

        with (
            patch("routers.match_router.get_match", return_value=match),
            patch(
                "routers.match_router.get_player_by_cognito_sub", return_value=player
            ),
            patch("routers.match_router.get_enrollment", return_value=None),
        ):
            resp = client.post("/api/v1/matches/m1/dispute")
            assert resp.status_code == 403

    def test_participant_can_dispute(self, client: TestClient) -> None:
        """A player in the match can dispute it."""
        match = _make_match_mock(
            team1=["participant"], team2=["p2"], submitted_by="participant"
        )
        player = _make_player_mock("participant")
        disputed = _make_match_mock(status="DISPUTED")

        with (
            patch("routers.match_router.get_match", return_value=match),
            patch(
                "routers.match_router.get_player_by_cognito_sub", return_value=player
            ),
            patch(
                "routers.match_router.get_enrollment",
                return_value=_make_enrollment_mock("player"),
            ),
            patch("routers.match_router.dispute_match", return_value=disputed),
        ):
            resp = client.post("/api/v1/matches/m1/dispute")
            assert resp.status_code == 200

    def test_league_admin_can_dispute(self, client: TestClient) -> None:
        """A league admin (not in match) can dispute."""
        match = _make_match_mock(team1=["p1"], team2=["p2"], submitted_by="p1")
        player = _make_player_mock("admin-user")

        with (
            patch("routers.match_router.get_match", return_value=match),
            patch(
                "routers.match_router.get_player_by_cognito_sub", return_value=player
            ),
            patch(
                "routers.match_router.get_enrollment",
                return_value=_make_enrollment_mock("admin"),
            ),
            patch(
                "routers.match_router.dispute_match",
                return_value=_make_match_mock(status="DISPUTED"),
            ),
        ):
            resp = client.post("/api/v1/matches/m1/dispute")
            assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Match confirm authorization
# ---------------------------------------------------------------------------
class TestConfirmAuthorization:
    """POST /api/v1/matches/{match_id}/confirm must check opponent/loser/admin."""

    def _confirm_patches(
        self,
        stack: ExitStack,
        match: MagicMock,
        player: MagicMock,
        enrollment: MagicMock | None,
        confirm_result: MagicMock | None = None,
    ) -> None:
        """Enter common patches for confirm tests into the given ExitStack."""
        stack.enter_context(patch("routers.match_router.get_match", return_value=match))
        stack.enter_context(
            patch("routers.match_router.get_player_by_cognito_sub", return_value=player)
        )
        stack.enter_context(
            patch("routers.match_router.get_enrollment", return_value=enrollment)
        )
        stack.enter_context(
            patch("routers.match_router.confirm_match", return_value=confirm_result)
        )

    def test_opponent_can_confirm(self, client: TestClient) -> None:
        """A player from the opposing team can confirm."""
        match = _make_match_mock(team1=["p1"], team2=["opponent"], submitted_by="p1")
        confirmed = _make_match_mock(status="CONFIRMED")
        player = _make_player_mock("opponent")

        with ExitStack() as stack:
            self._confirm_patches(
                stack,
                match,
                player,
                _make_enrollment_mock("player"),
                _make_confirmation_result_mock(confirmed),
            )
            resp = client.post("/api/v1/matches/m1/confirm")
            assert resp.status_code == 200

    def test_admin_can_confirm(self, client: TestClient) -> None:
        """A league admin (not in match) can confirm."""
        match = _make_match_mock(team1=["p1"], team2=["p2"], submitted_by="p1")
        confirmed = _make_match_mock(status="CONFIRMED")
        player = _make_player_mock("admin-user")

        with ExitStack() as stack:
            self._confirm_patches(
                stack,
                match,
                player,
                _make_enrollment_mock("admin"),
                _make_confirmation_result_mock(confirmed),
            )
            resp = client.post("/api/v1/matches/m1/confirm")
            assert resp.status_code == 200

    def test_loser_can_confirm_when_submitter_is_external(
        self, client: TestClient
    ) -> None:
        """A losing team player can confirm when the submitter is not in either team."""
        match = _make_match_mock(
            team1=["p1"],
            team2=["loser-player"],
            submitted_by="external-user",
            team1_score=10,
            team2_score=7,
        )
        confirmed = _make_match_mock(status="CONFIRMED")
        player = _make_player_mock("loser-player")

        with ExitStack() as stack:
            self._confirm_patches(
                stack,
                match,
                player,
                _make_enrollment_mock("player"),
                _make_confirmation_result_mock(confirmed),
            )
            resp = client.post("/api/v1/matches/m1/confirm")
            assert resp.status_code == 200

    def test_loser_can_confirm_when_submitter_is_winner(
        self, client: TestClient
    ) -> None:
        """A losing team player can confirm when the submitter is on the winning team."""
        match = _make_match_mock(
            team1=["p1"],
            team2=["loser-player"],
            submitted_by="p1",
            team1_score=10,
            team2_score=7,
        )
        confirmed = _make_match_mock(status="CONFIRMED")
        player = _make_player_mock("loser-player")

        with ExitStack() as stack:
            self._confirm_patches(
                stack,
                match,
                player,
                _make_enrollment_mock("player"),
                _make_confirmation_result_mock(confirmed),
            )
            resp = client.post("/api/v1/matches/m1/confirm")
            assert resp.status_code == 200

    def test_winner_cannot_confirm_when_submitter_is_external(
        self, client: TestClient
    ) -> None:
        """A winning team player cannot confirm when the submitter is external (not opponent)."""
        match = _make_match_mock(
            team1=["winner-player"],
            team2=["p2"],
            submitted_by="external-user",
            team1_score=10,
            team2_score=7,
        )
        player = _make_player_mock("winner-player")

        with ExitStack() as stack:
            self._confirm_patches(stack, match, player, _make_enrollment_mock("player"))
            resp = client.post("/api/v1/matches/m1/confirm")
            assert resp.status_code == 403

    def test_submitter_cannot_confirm_own_match_even_if_loser(
        self, client: TestClient
    ) -> None:
        """The submitter cannot confirm their own match, even if they are on the losing team."""
        match = _make_match_mock(
            team1=["p1"],
            team2=["self-reporter"],
            submitted_by="self-reporter",
            team1_score=10,
            team2_score=7,
        )
        player = _make_player_mock("self-reporter")

        with ExitStack() as stack:
            self._confirm_patches(stack, match, player, _make_enrollment_mock("player"))
            resp = client.post("/api/v1/matches/m1/confirm")
            assert resp.status_code == 403

    def test_non_participant_non_admin_gets_403(self, client: TestClient) -> None:
        """A user who is not in the match and not league admin cannot confirm."""
        match = _make_match_mock(team1=["p1"], team2=["p2"], submitted_by="p1")
        player = _make_player_mock("outsider")

        with ExitStack() as stack:
            self._confirm_patches(stack, match, player, None)
            resp = client.post("/api/v1/matches/m1/confirm")
            assert resp.status_code == 403


# ---------------------------------------------------------------------------
# League update authorization
# ---------------------------------------------------------------------------
class TestLeagueUpdateAuthorization:
    """PATCH /api/v1/leagues/{league_id} must require admin."""

    def test_non_admin_gets_403(self, client: TestClient) -> None:
        """A non-admin member cannot update league settings."""
        player = _make_player_mock("regular-player")
        enrollment = _make_enrollment_mock("player")

        with (
            patch(
                "routers.league_router.get_player_by_cognito_sub", return_value=player
            ),
            patch("routers.league_router.get_enrollment", return_value=enrollment),
        ):
            resp = client.patch("/api/v1/leagues/lg1", json={"name": "Hacked"})
            assert resp.status_code == 403

    def test_admin_can_update(self, client: TestClient) -> None:
        """An admin can update league settings."""
        player = _make_player_mock("admin-player")
        mock_league = MagicMock()
        mock_league.league_id = "lg1"
        mock_league.name = "Updated"
        mock_league.league_type = "2v2"
        mock_league.initial_elo = 1200
        mock_league.description = ""
        mock_league.member_count = 4
        mock_league.match_count = 10

        with (
            patch(
                "routers.league_router.get_player_by_cognito_sub", return_value=player
            ),
            patch(
                "routers.league_router.get_enrollment",
                return_value=_make_enrollment_mock("admin"),
            ),
            patch("routers.league_router.update_league", return_value=mock_league),
        ):
            resp = client.patch("/api/v1/leagues/lg1", json={"name": "Updated"})
            assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Player email redaction
# ---------------------------------------------------------------------------
class TestPlayerEmailRedaction:
    """GET /api/v1/players/ must NOT expose email addresses."""

    def test_list_players_omits_email(self, client: TestClient) -> None:
        """Player list response should not contain email field."""
        mock_player = MagicMock()
        mock_player.player_id = "p1"
        mock_player.display_name = "Alice"
        mock_player.email = "alice@secret.com"
        mock_player.total_matches = 5
        mock_player.total_wins = 3
        mock_player.total_losses = 2

        with patch("routers.player_router.list_players", return_value=[mock_player]):
            resp = client.get("/api/v1/players/")
            assert resp.status_code == 200
            data = resp.json()
            assert len(data) == 1
            assert "email" not in data[0]
