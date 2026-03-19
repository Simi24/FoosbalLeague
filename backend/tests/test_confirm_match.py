"""Unit tests for the confirm_match orchestrator (ConfirmationResult refactor).

Each test targets a single behaviour slice of confirm_match().
Mocking strategy: patch DynamoDB-backed helpers and achievement evaluation
so the tests stay fast and deterministic.
"""

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest
from models.match import MatchModel
from models.rating import RatingModel
from schemas.confirmation import (
    ConfirmationResult,
    EloChangeDetail,
    UnlockedAchievement,
)
from services.exceptions import MatchNotFoundError, MissingRatingsError
from services.match_service import confirm_match

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_match(
    *,
    match_id: str = "m1",
    tenant_id: str = "t1",
    league_id: str = "lg1",
    team1: list[str] | None = None,
    team2: list[str] | None = None,
    team1_score: int = 10,
    team2_score: int = 5,
    status: str = "PENDING",
    submitted_by: str = "p1",
) -> MatchModel:
    now = datetime.now(timezone.utc)
    return MatchModel(
        pk=f"TENANT#{tenant_id}",
        sk=f"MATCH#{match_id}",
        gsi1_pk=f"LEAGUE#{league_id}",
        gsi1_sk=f"MATCH#{now.isoformat()}#{match_id}",
        match_id=match_id,
        league_id=league_id,
        team1_player_ids=team1 or ["p1"],
        team2_player_ids=team2 or ["p2"],
        team1_score=team1_score,
        team2_score=team2_score,
        status=status,
        submitted_by=submitted_by,
        created_at=now,
        updated_at=now,
    )


def _make_rating(
    *,
    tenant_id: str = "t1",
    league_id: str = "lg1",
    player_id: str,
    elo: int = 1200,
    matches_played: int = 5,
    wins: int = 3,
    losses: int = 2,
    display_name: str = "",
) -> RatingModel:
    if not display_name:
        display_name = player_id.title()
    now = datetime.now(timezone.utc)
    inverted = str(9999 - elo).zfill(4)
    return RatingModel(
        pk=f"TENANT#{tenant_id}",
        sk=f"RATING#{league_id}#{player_id}",
        gsi1_pk=f"LEAGUE#{league_id}",
        gsi1_sk=f"RATING#{inverted}#{player_id}",
        league_id=league_id,
        player_id=player_id,
        display_name=display_name,
        elo=elo,
        matches_played=matches_played,
        wins=wins,
        losses=losses,
        created_at=now,
        updated_at=now,
    )


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

SERVICE = "services.match_service"


@pytest.fixture()
def _patch_db():
    """Patch all DB-touching helpers inside match_service."""
    with (
        patch(f"{SERVICE}.get_match") as mock_get_match,
        patch(f"{SERVICE}._get_rating") as mock_get_rating,
        patch(f"{SERVICE}._update_rating") as mock_update_rating,
        patch(f"{SERVICE}._write_elo_history") as mock_write_history,
        patch(f"{SERVICE}.MatchModel") as mock_match_model,
        patch(f"{SERVICE}.evaluate_achievements") as mock_eval,
    ):
        # Default: no achievements unlocked
        mock_eval.return_value = []
        yield {
            "get_match": mock_get_match,
            "get_rating": mock_get_rating,
            "update_rating": mock_update_rating,
            "write_history": mock_write_history,
            "match_model": mock_match_model,
            "eval_achievements": mock_eval,
        }


# ---------------------------------------------------------------------------
# Tests: Exception paths
# ---------------------------------------------------------------------------


class TestConfirmMatchNotFound:
    """confirm_match raises MatchNotFoundError when match is missing or not PENDING."""

    def test_match_not_found(self, _patch_db):
        _patch_db["get_match"].return_value = None
        with pytest.raises(MatchNotFoundError):
            confirm_match("t1", "no-such-id", "p2")

    def test_already_confirmed(self, _patch_db):
        match = _make_match(status="CONFIRMED")
        _patch_db["get_match"].return_value = match
        with pytest.raises(MatchNotFoundError):
            confirm_match("t1", "m1", "p2")

    def test_already_disputed(self, _patch_db):
        match = _make_match(status="DISPUTED")
        _patch_db["get_match"].return_value = match
        with pytest.raises(MatchNotFoundError):
            confirm_match("t1", "m1", "p2")


class TestConfirmMatchMissingRatings:
    """confirm_match raises MissingRatingsError when ratings are absent."""

    def test_team1_missing(self, _patch_db):
        match = _make_match()
        _patch_db["get_match"].return_value = match
        # team1 player returns None, team2 returns a rating
        _patch_db["get_rating"].side_effect = lambda _t, _l, pid: (
            _make_rating(player_id=pid) if pid == "p2" else None
        )
        with pytest.raises(MissingRatingsError):
            confirm_match("t1", "m1", "p2")

    def test_team2_missing(self, _patch_db):
        match = _make_match()
        _patch_db["get_match"].return_value = match
        _patch_db["get_rating"].side_effect = lambda _t, _l, pid: (
            _make_rating(player_id=pid) if pid == "p1" else None
        )
        with pytest.raises(MissingRatingsError):
            confirm_match("t1", "m1", "p2")


# ---------------------------------------------------------------------------
# Tests: Successful confirmation — return type
# ---------------------------------------------------------------------------


class TestConfirmMatchReturnsResult:
    """confirm_match returns a ConfirmationResult on success."""

    def _setup_happy(
        self, mocks, *, team1=None, team2=None, team1_score=10, team2_score=5
    ):
        team1 = team1 or ["p1"]
        team2 = team2 or ["p2"]
        match = _make_match(
            team1=team1,
            team2=team2,
            team1_score=team1_score,
            team2_score=team2_score,
        )
        mocks["get_match"].side_effect = [
            match,  # first call: lookup
            match,  # second call: re-fetch after update
        ]
        mocks["get_rating"].side_effect = lambda _t, _l, pid: _make_rating(
            player_id=pid
        )
        # mock MatchModel.update chain
        chain = MagicMock()
        mocks["match_model"].update.return_value = chain
        chain.set.return_value = chain
        chain.execute.return_value = None
        return match

    def test_returns_confirmation_result(self, _patch_db):
        self._setup_happy(_patch_db)
        result = confirm_match("t1", "m1", "p2")
        assert isinstance(result, ConfirmationResult)

    def test_result_contains_match(self, _patch_db):
        match = self._setup_happy(_patch_db)
        result = confirm_match("t1", "m1", "p2")
        assert result.match.match_id == match.match_id

    def test_result_has_elo_changes(self, _patch_db):
        self._setup_happy(_patch_db)
        result = confirm_match("t1", "m1", "p2")
        assert len(result.elo_changes) == 2
        ids = {c.player_id for c in result.elo_changes}
        assert ids == {"p1", "p2"}

    def test_elo_change_detail_fields(self, _patch_db):
        self._setup_happy(_patch_db)
        result = confirm_match("t1", "m1", "p2")
        for detail in result.elo_changes:
            assert isinstance(detail, EloChangeDetail)
            assert isinstance(detail.elo_before, int)
            assert isinstance(detail.elo_after, int)
            assert detail.delta == detail.elo_after - detail.elo_before
            assert detail.display_name  # non-empty

    def test_winner_gains_loser_loses(self, _patch_db):
        self._setup_happy(_patch_db, team1_score=10, team2_score=5)
        result = confirm_match("t1", "m1", "p2")
        changes = {c.player_id: c for c in result.elo_changes}
        assert changes["p1"].delta > 0  # winner
        assert changes["p2"].delta < 0  # loser

    def test_2v2_returns_four_details(self, _patch_db):
        self._setup_happy(_patch_db, team1=["p1", "p2"], team2=["p3", "p4"])
        result = confirm_match("t1", "m1", "p3")
        assert len(result.elo_changes) == 4


# ---------------------------------------------------------------------------
# Tests: elo_before / elo_after correctness
# ---------------------------------------------------------------------------


class TestEloBeforeAfter:
    """elo_before comes from the rating at query time; elo_after = elo_before + delta."""

    def test_elo_before_matches_rating(self, _patch_db):
        match = _make_match()
        _patch_db["get_match"].side_effect = [match, match]
        _patch_db["get_rating"].side_effect = lambda _t, _l, pid: _make_rating(
            player_id=pid, elo=1300 if pid == "p1" else 1100
        )
        chain = MagicMock()
        _patch_db["match_model"].update.return_value = chain
        chain.set.return_value = chain
        chain.execute.return_value = None

        result = confirm_match("t1", "m1", "p2")
        changes = {c.player_id: c for c in result.elo_changes}
        assert changes["p1"].elo_before == 1300
        assert changes["p2"].elo_before == 1100

    def test_elo_after_equals_before_plus_delta(self, _patch_db):
        match = _make_match()
        _patch_db["get_match"].side_effect = [match, match]
        _patch_db["get_rating"].side_effect = lambda _t, _l, pid: _make_rating(
            player_id=pid
        )
        chain = MagicMock()
        _patch_db["match_model"].update.return_value = chain
        chain.set.return_value = chain
        chain.execute.return_value = None

        result = confirm_match("t1", "m1", "p2")
        for detail in result.elo_changes:
            assert detail.elo_after == detail.elo_before + detail.delta


# ---------------------------------------------------------------------------
# Tests: Achievement capture
# ---------------------------------------------------------------------------


class TestAchievementCapture:
    """Newly unlocked achievements are captured in the result."""

    def test_no_achievements_empty_list(self, _patch_db):
        match = _make_match()
        _patch_db["get_match"].side_effect = [match, match]
        _patch_db["get_rating"].side_effect = lambda _t, _l, pid: _make_rating(
            player_id=pid
        )
        _patch_db["eval_achievements"].return_value = []
        chain = MagicMock()
        _patch_db["match_model"].update.return_value = chain
        chain.set.return_value = chain
        chain.execute.return_value = None

        result = confirm_match("t1", "m1", "p2")
        assert result.newly_unlocked == []

    def test_newly_unlocked_populated(self, _patch_db):
        match = _make_match()
        _patch_db["get_match"].side_effect = [match, match]
        _patch_db["get_rating"].side_effect = lambda _t, _l, pid: _make_rating(
            player_id=pid
        )
        _patch_db["eval_achievements"].return_value = ["p1:first_blood", "p2:veteran"]
        chain = MagicMock()
        _patch_db["match_model"].update.return_value = chain
        chain.set.return_value = chain
        chain.execute.return_value = None

        result = confirm_match("t1", "m1", "p2")
        assert len(result.newly_unlocked) == 2
        types = {a.achievement_type for a in result.newly_unlocked}
        assert types == {"first_blood", "veteran"}

    def test_unlocked_has_catalog_metadata(self, _patch_db):
        match = _make_match()
        _patch_db["get_match"].side_effect = [match, match]
        _patch_db["get_rating"].side_effect = lambda _t, _l, pid: _make_rating(
            player_id=pid
        )
        _patch_db["eval_achievements"].return_value = ["p1:first_blood"]
        chain = MagicMock()
        _patch_db["match_model"].update.return_value = chain
        chain.set.return_value = chain
        chain.execute.return_value = None

        result = confirm_match("t1", "m1", "p2")
        a = result.newly_unlocked[0]
        assert isinstance(a, UnlockedAchievement)
        assert a.player_id == "p1"
        assert a.achievement_type == "first_blood"
        assert a.name == "First Blood"
        assert a.icon == "swords"
        assert a.rarity == "common"

    def test_unknown_achievement_type_skipped(self, _patch_db):
        """If evaluate_achievements returns a type not in the catalog, skip it."""
        match = _make_match()
        _patch_db["get_match"].side_effect = [match, match]
        _patch_db["get_rating"].side_effect = lambda _t, _l, pid: _make_rating(
            player_id=pid
        )
        _patch_db["eval_achievements"].return_value = ["p1:totally_made_up"]
        chain = MagicMock()
        _patch_db["match_model"].update.return_value = chain
        chain.set.return_value = chain
        chain.execute.return_value = None

        result = confirm_match("t1", "m1", "p2")
        assert result.newly_unlocked == []


# ---------------------------------------------------------------------------
# Tests: Side-effects are still called
# ---------------------------------------------------------------------------


class TestSideEffects:
    """confirm_match still calls _update_rating, _write_elo_history, and MatchModel.update."""

    def test_update_rating_called_for_each_player(self, _patch_db):
        match = _make_match(team1=["p1", "p2"], team2=["p3", "p4"])
        _patch_db["get_match"].side_effect = [match, match]
        _patch_db["get_rating"].side_effect = lambda _t, _l, pid: _make_rating(
            player_id=pid
        )
        chain = MagicMock()
        _patch_db["match_model"].update.return_value = chain
        chain.set.return_value = chain
        chain.execute.return_value = None

        confirm_match("t1", "m1", "p3")
        assert _patch_db["update_rating"].call_count == 4

    def test_write_history_called_for_each_player(self, _patch_db):
        match = _make_match()
        _patch_db["get_match"].side_effect = [match, match]
        _patch_db["get_rating"].side_effect = lambda _t, _l, pid: _make_rating(
            player_id=pid
        )
        chain = MagicMock()
        _patch_db["match_model"].update.return_value = chain
        chain.set.return_value = chain
        chain.execute.return_value = None

        confirm_match("t1", "m1", "p2")
        assert _patch_db["write_history"].call_count == 2

    def test_match_model_update_called(self, _patch_db):
        match = _make_match()
        _patch_db["get_match"].side_effect = [match, match]
        _patch_db["get_rating"].side_effect = lambda _t, _l, pid: _make_rating(
            player_id=pid
        )
        chain = MagicMock()
        _patch_db["match_model"].update.return_value = chain
        chain.set.return_value = chain
        chain.execute.return_value = None

        confirm_match("t1", "m1", "p2")
        _patch_db["match_model"].update.assert_called_once_with(match.pk, match.sk)
