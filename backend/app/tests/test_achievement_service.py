"""Unit tests for achievement evaluation with MatchContext.

TDD: each test targets a single achievement rule in isolation.
All DB access is replaced via callable overrides.
"""

from datetime import UTC, datetime

from models.match import MatchModel
from schemas.match_context import MatchContext, PlayerMatchResult
from services.achievement_service import (
    ACHIEVEMENT_CATALOG,
    _count_low_concede_wins,
    _count_win_streak,
    evaluate_achievements,
)

NOW = datetime.now(UTC)


# ── Helpers ──────────────────────────────────────────────────────────────────


def _make_match(
    team1: list[str],
    team2: list[str],
    t1_score: int = 10,
    t2_score: int = 5,
    match_id: str = "m1",
    status: str = "CONFIRMED",
) -> MatchModel:
    ts = NOW.isoformat()
    return MatchModel(
        pk="TENANT#t1",
        sk=f"MATCH#{match_id}",
        gsi1_pk="LEAGUE#l1",
        gsi1_sk=f"MATCH#{ts}#{match_id}",
        match_id=match_id,
        league_id="l1",
        team1_player_ids=team1,
        team2_player_ids=team2,
        team1_score=t1_score,
        team2_score=t2_score,
        status=status,
        submitted_by="p1",
        created_at=NOW,
        updated_at=NOW,
    )


def _make_player(
    pid: str,
    team: int,
    won: bool,
    elo_before: int = 1200,
    elo_delta: int = 20,
    matches_played: int = 1,
    wins: int = 1,
) -> PlayerMatchResult:
    return PlayerMatchResult(
        player_id=pid,
        team=team,
        won=won,
        elo_before=elo_before,
        elo_delta=elo_delta,
        elo_after=elo_before + elo_delta,
        matches_played=matches_played,
        wins=wins,
    )


def _make_ctx(
    match: MatchModel | None = None,
    players: dict[str, PlayerMatchResult] | None = None,
    team1_avg: float = 1200.0,
    team2_avg: float = 1200.0,
) -> MatchContext:
    if match is None:
        match = _make_match(["p1"], ["p2"])
    if players is None:
        players = {
            "p1": _make_player("p1", 1, True),
            "p2": _make_player("p2", 2, False, elo_delta=-20, wins=0),
        }
    return MatchContext(
        tenant_id="t1",
        league_id="l1",
        match=match,
        players=players,
        team1_avg_elo_before=team1_avg,
        team2_avg_elo_before=team2_avg,
    )


def _no_unlocked(_tid: str, _lid: str, _pid: str) -> list:
    """Override: no achievements unlocked yet."""
    return []


def _no_recent(_lid: str, _pid: str, limit: int = 5) -> list[MatchModel]:
    """Override: no recent matches."""
    return []


def _empty_leaderboard(_lid: str) -> list:
    """Override: empty leaderboard."""
    return []


def _no_save(_tid: str, _lid: str, _pid: str, _atype: str) -> None:
    """Override: no-op save."""


# ── CATALOG ──────────────────────────────────────────────────────────────────


class TestAchievementCatalog:
    def test_catalog_has_10_achievements(self):
        assert len(ACHIEVEMENT_CATALOG) == 10

    def test_all_types_unique(self):
        types = [a["type"] for a in ACHIEVEMENT_CATALOG]
        assert len(types) == len(set(types))


# ── FIRST BLOOD ──────────────────────────────────────────────────────────────


class TestFirstBlood:
    def test_awarded_on_first_win(self):
        ctx = _make_ctx()
        result = evaluate_achievements(
            ctx,
            get_unlocked=_no_unlocked,
            get_recent=_no_recent,
            get_leaderboard=_empty_leaderboard,
            save=_no_save,
        )
        assert "p1:first_blood" in result

    def test_not_awarded_to_loser(self):
        ctx = _make_ctx()
        result = evaluate_achievements(
            ctx,
            get_unlocked=_no_unlocked,
            get_recent=_no_recent,
            get_leaderboard=_empty_leaderboard,
            save=_no_save,
        )
        assert "p2:first_blood" not in result

    def test_not_awarded_if_already_unlocked(self):
        from models.achievement import AchievementModel

        def _already_has_first_blood(_tid, _lid, pid):
            if pid == "p1":
                return [
                    AchievementModel(
                        pk="TENANT#t1",
                        sk="ACHIEVE#l1#p1#first_blood",
                        league_id="l1",
                        player_id="p1",
                        achievement_type="first_blood",
                        unlocked_at=NOW,
                        created_at=NOW,
                        updated_at=NOW,
                    )
                ]
            return []

        ctx = _make_ctx()
        result = evaluate_achievements(
            ctx,
            get_unlocked=_already_has_first_blood,
            get_recent=_no_recent,
            get_leaderboard=_empty_leaderboard,
            save=_no_save,
        )
        assert "p1:first_blood" not in result


# ── VETERAN ──────────────────────────────────────────────────────────────────


class TestVeteran:
    def test_awarded_at_10_matches(self):
        match = _make_match(["p1"], ["p2"])
        players = {
            "p1": _make_player("p1", 1, True, matches_played=10, wins=6),
            "p2": _make_player(
                "p2", 2, False, elo_delta=-20, matches_played=10, wins=4
            ),
        }
        ctx = _make_ctx(match=match, players=players)
        result = evaluate_achievements(
            ctx,
            get_unlocked=_no_unlocked,
            get_recent=_no_recent,
            get_leaderboard=_empty_leaderboard,
            save=_no_save,
        )
        assert "p1:veteran" in result
        assert "p2:veteran" in result

    def test_not_awarded_at_9_matches(self):
        match = _make_match(["p1"], ["p2"])
        players = {
            "p1": _make_player("p1", 1, True, matches_played=9),
            "p2": _make_player("p2", 2, False, elo_delta=-20, matches_played=9, wins=0),
        }
        ctx = _make_ctx(match=match, players=players)
        result = evaluate_achievements(
            ctx,
            get_unlocked=_no_unlocked,
            get_recent=_no_recent,
            get_leaderboard=_empty_leaderboard,
            save=_no_save,
        )
        assert "p1:veteran" not in result


# ── CENTURION ────────────────────────────────────────────────────────────────


class TestCenturion:
    def test_awarded_at_50_matches(self):
        match = _make_match(["p1"], ["p2"])
        players = {
            "p1": _make_player("p1", 1, True, matches_played=50, wins=30),
            "p2": _make_player(
                "p2", 2, False, elo_delta=-20, matches_played=50, wins=20
            ),
        }
        ctx = _make_ctx(match=match, players=players)
        result = evaluate_achievements(
            ctx,
            get_unlocked=_no_unlocked,
            get_recent=_no_recent,
            get_leaderboard=_empty_leaderboard,
            save=_no_save,
        )
        assert "p1:centurion" in result

    def test_not_awarded_at_49(self):
        players = {
            "p1": _make_player("p1", 1, True, matches_played=49),
            "p2": _make_player(
                "p2", 2, False, elo_delta=-20, matches_played=49, wins=0
            ),
        }
        ctx = _make_ctx(players=players)
        result = evaluate_achievements(
            ctx,
            get_unlocked=_no_unlocked,
            get_recent=_no_recent,
            get_leaderboard=_empty_leaderboard,
            save=_no_save,
        )
        assert "p1:centurion" not in result


# ── SHUTOUT ──────────────────────────────────────────────────────────────────


class TestShutout:
    def test_awarded_when_opponent_scores_zero(self):
        match = _make_match(["p1"], ["p2"], t1_score=10, t2_score=0)
        players = {
            "p1": _make_player("p1", 1, True),
            "p2": _make_player("p2", 2, False, elo_delta=-20, wins=0),
        }
        ctx = _make_ctx(match=match, players=players)
        result = evaluate_achievements(
            ctx,
            get_unlocked=_no_unlocked,
            get_recent=_no_recent,
            get_leaderboard=_empty_leaderboard,
            save=_no_save,
        )
        assert "p1:shutout" in result
        assert "p2:shutout" not in result

    def test_not_awarded_when_opponent_scores(self):
        match = _make_match(["p1"], ["p2"], t1_score=10, t2_score=1)
        players = {
            "p1": _make_player("p1", 1, True),
            "p2": _make_player("p2", 2, False, elo_delta=-20, wins=0),
        }
        ctx = _make_ctx(match=match, players=players)
        result = evaluate_achievements(
            ctx,
            get_unlocked=_no_unlocked,
            get_recent=_no_recent,
            get_leaderboard=_empty_leaderboard,
            save=_no_save,
        )
        assert "p1:shutout" not in result


# ── GIANT KILLER ─────────────────────────────────────────────────────────────


class TestGiantKiller:
    def test_awarded_when_elo_diff_ge_50(self):
        match = _make_match(["p1"], ["p2"])
        players = {
            "p1": _make_player("p1", 1, True, elo_before=1150),
            "p2": _make_player("p2", 2, False, elo_before=1250, elo_delta=-20, wins=0),
        }
        # team2 avg (1250) - team1 avg (1150) = 100 >= 50
        ctx = _make_ctx(
            match=match, players=players, team1_avg=1150.0, team2_avg=1250.0
        )
        result = evaluate_achievements(
            ctx,
            get_unlocked=_no_unlocked,
            get_recent=_no_recent,
            get_leaderboard=_empty_leaderboard,
            save=_no_save,
        )
        assert "p1:giant_killer" in result

    def test_not_awarded_when_elo_diff_lt_50(self):
        match = _make_match(["p1"], ["p2"])
        players = {
            "p1": _make_player("p1", 1, True, elo_before=1180),
            "p2": _make_player("p2", 2, False, elo_before=1220, elo_delta=-20, wins=0),
        }
        ctx = _make_ctx(
            match=match, players=players, team1_avg=1180.0, team2_avg=1220.0
        )
        result = evaluate_achievements(
            ctx,
            get_unlocked=_no_unlocked,
            get_recent=_no_recent,
            get_leaderboard=_empty_leaderboard,
            save=_no_save,
        )
        assert "p1:giant_killer" not in result

    def test_uses_pre_update_elo(self):
        """The ELO diff must use before-match averages, not post-update."""
        match = _make_match(["p1"], ["p2"])
        players = {
            "p1": _make_player("p1", 1, True, elo_before=1150, elo_delta=30),
            "p2": _make_player("p2", 2, False, elo_before=1200, elo_delta=-30, wins=0),
        }
        # Before: diff = 1200 - 1150 = 50 -> should qualify
        # After: diff = 1170 - 1180 = -10 -> would NOT qualify if using post-update
        ctx = _make_ctx(
            match=match, players=players, team1_avg=1150.0, team2_avg=1200.0
        )
        result = evaluate_achievements(
            ctx,
            get_unlocked=_no_unlocked,
            get_recent=_no_recent,
            get_leaderboard=_empty_leaderboard,
            save=_no_save,
        )
        assert "p1:giant_killer" in result


# ── UNDERDOG ─────────────────────────────────────────────────────────────────


class TestUnderdog:
    def test_awarded_when_elo_diff_ge_100(self):
        match = _make_match(["p1"], ["p2"])
        players = {
            "p1": _make_player("p1", 1, True, elo_before=1100),
            "p2": _make_player("p2", 2, False, elo_before=1300, elo_delta=-20, wins=0),
        }
        ctx = _make_ctx(
            match=match, players=players, team1_avg=1100.0, team2_avg=1300.0
        )
        result = evaluate_achievements(
            ctx,
            get_unlocked=_no_unlocked,
            get_recent=_no_recent,
            get_leaderboard=_empty_leaderboard,
            save=_no_save,
        )
        assert "p1:underdog" in result
        # Also gets giant_killer since 100 >= 50
        assert "p1:giant_killer" in result

    def test_not_awarded_at_99(self):
        match = _make_match(["p1"], ["p2"])
        players = {
            "p1": _make_player("p1", 1, True, elo_before=1151),
            "p2": _make_player("p2", 2, False, elo_before=1250, elo_delta=-20, wins=0),
        }
        ctx = _make_ctx(
            match=match, players=players, team1_avg=1151.0, team2_avg=1250.0
        )
        result = evaluate_achievements(
            ctx,
            get_unlocked=_no_unlocked,
            get_recent=_no_recent,
            get_leaderboard=_empty_leaderboard,
            save=_no_save,
        )
        assert "p1:underdog" not in result

    def test_team2_winner_underdog(self):
        """Team 2 winning against higher-rated team 1."""
        match = _make_match(["p1"], ["p2"], t1_score=3, t2_score=10)
        players = {
            "p1": _make_player("p1", 1, False, elo_before=1300, elo_delta=-30, wins=0),
            "p2": _make_player("p2", 2, True, elo_before=1100, elo_delta=30),
        }
        ctx = _make_ctx(
            match=match, players=players, team1_avg=1300.0, team2_avg=1100.0
        )
        result = evaluate_achievements(
            ctx,
            get_unlocked=_no_unlocked,
            get_recent=_no_recent,
            get_leaderboard=_empty_leaderboard,
            save=_no_save,
        )
        assert "p2:underdog" in result
        assert "p1:underdog" not in result


# ── HAT TRICK ────────────────────────────────────────────────────────────────


class TestHatTrick:
    def test_awarded_on_3_win_streak(self):
        recent = [
            _make_match(["p1"], ["p2"], t1_score=10, t2_score=5, match_id=f"m{i}")
            for i in range(3)
        ]

        def _recent_3(_lid, _pid, limit=5):
            return recent

        ctx = _make_ctx()
        result = evaluate_achievements(
            ctx,
            get_unlocked=_no_unlocked,
            get_recent=_recent_3,
            get_leaderboard=_empty_leaderboard,
            save=_no_save,
        )
        assert "p1:hat_trick" in result

    def test_not_awarded_on_2_wins(self):
        recent = [
            _make_match(["p1"], ["p2"], t1_score=10, t2_score=5, match_id="m1"),
            _make_match(["p1"], ["p2"], t1_score=10, t2_score=5, match_id="m2"),
            _make_match(["p1"], ["p2"], t1_score=3, t2_score=10, match_id="m3"),
        ]

        def _recent_with_loss(_lid, _pid, limit=5):
            return recent

        ctx = _make_ctx()
        result = evaluate_achievements(
            ctx,
            get_unlocked=_no_unlocked,
            get_recent=_recent_with_loss,
            get_leaderboard=_empty_leaderboard,
            save=_no_save,
        )
        assert "p1:hat_trick" not in result


# ── ON FIRE ──────────────────────────────────────────────────────────────────


class TestOnFire:
    def test_awarded_on_5_win_streak(self):
        recent = [
            _make_match(["p1"], ["p2"], t1_score=10, t2_score=5, match_id=f"m{i}")
            for i in range(5)
        ]

        def _recent_5(_lid, _pid, limit=5):
            return recent

        ctx = _make_ctx()
        result = evaluate_achievements(
            ctx,
            get_unlocked=_no_unlocked,
            get_recent=_recent_5,
            get_leaderboard=_empty_leaderboard,
            save=_no_save,
        )
        assert "p1:on_fire" in result
        # Also gets hat_trick
        assert "p1:hat_trick" in result

    def test_not_awarded_on_4_wins(self):
        recent = [
            _make_match(["p1"], ["p2"], t1_score=10, t2_score=5, match_id=f"m{i}")
            for i in range(4)
        ]
        recent.append(
            _make_match(["p1"], ["p2"], t1_score=3, t2_score=10, match_id="mloss")
        )

        def _recent_4_and_loss(_lid, _pid, limit=5):
            return recent

        ctx = _make_ctx()
        result = evaluate_achievements(
            ctx,
            get_unlocked=_no_unlocked,
            get_recent=_recent_4_and_loss,
            get_leaderboard=_empty_leaderboard,
            save=_no_save,
        )
        assert "p1:on_fire" not in result
        assert "p1:hat_trick" in result


# ── BRICK WALL ───────────────────────────────────────────────────────────────


class TestBrickWall:
    def test_awarded_on_3_low_concede_wins(self):
        recent = [
            _make_match(["p1"], ["p2"], t1_score=10, t2_score=2, match_id=f"m{i}")
            for i in range(3)
        ]

        def _recent_low(_lid, _pid, limit=5):
            return recent

        ctx = _make_ctx()
        result = evaluate_achievements(
            ctx,
            get_unlocked=_no_unlocked,
            get_recent=_recent_low,
            get_leaderboard=_empty_leaderboard,
            save=_no_save,
        )
        assert "p1:brick_wall" in result

    def test_not_awarded_when_concede_exceeds_3(self):
        recent = [
            _make_match(["p1"], ["p2"], t1_score=10, t2_score=2, match_id="m1"),
            _make_match(
                ["p1"], ["p2"], t1_score=10, t2_score=4, match_id="m2"
            ),  # 4 > 3
            _make_match(["p1"], ["p2"], t1_score=10, t2_score=1, match_id="m3"),
        ]

        def _recent_high_concede(_lid, _pid, limit=5):
            return recent

        ctx = _make_ctx()
        result = evaluate_achievements(
            ctx,
            get_unlocked=_no_unlocked,
            get_recent=_recent_high_concede,
            get_leaderboard=_empty_leaderboard,
            save=_no_save,
        )
        assert "p1:brick_wall" not in result

    def test_concede_exactly_3_is_ok(self):
        recent = [
            _make_match(["p1"], ["p2"], t1_score=10, t2_score=3, match_id=f"m{i}")
            for i in range(3)
        ]

        def _recent_exact(_lid, _pid, limit=5):
            return recent

        ctx = _make_ctx()
        result = evaluate_achievements(
            ctx,
            get_unlocked=_no_unlocked,
            get_recent=_recent_exact,
            get_leaderboard=_empty_leaderboard,
            save=_no_save,
        )
        assert "p1:brick_wall" in result


# ── TOP DOG ──────────────────────────────────────────────────────────────────


class TestTopDog:
    def test_awarded_when_rank_1(self):
        from models.rating import RatingModel

        lb = [
            RatingModel(
                pk="TENANT#t1",
                sk="RATING#l1#p1",
                gsi1_pk="LEAGUE#l1",
                gsi1_sk="RATING#8780#p1",
                league_id="l1",
                player_id="p1",
                display_name="Player 1",
                elo=1220,
                matches_played=1,
                wins=1,
                created_at=NOW,
                updated_at=NOW,
            ),
            RatingModel(
                pk="TENANT#t1",
                sk="RATING#l1#p2",
                gsi1_pk="LEAGUE#l1",
                gsi1_sk="RATING#9000#p2",
                league_id="l1",
                player_id="p2",
                display_name="Player 2",
                elo=1180,
                matches_played=1,
                wins=0,
                created_at=NOW,
                updated_at=NOW,
            ),
        ]

        def _lb_p1_first(_lid):
            return lb

        ctx = _make_ctx()
        result = evaluate_achievements(
            ctx,
            get_unlocked=_no_unlocked,
            get_recent=_no_recent,
            get_leaderboard=_lb_p1_first,
            save=_no_save,
        )
        assert "p1:top_dog" in result
        assert "p2:top_dog" not in result

    def test_not_awarded_when_rank_2(self):
        from models.rating import RatingModel

        lb = [
            RatingModel(
                pk="TENANT#t1",
                sk="RATING#l1#p2",
                gsi1_pk="LEAGUE#l1",
                gsi1_sk="RATING#8780#p2",
                league_id="l1",
                player_id="p2",
                display_name="Player 2",
                elo=1220,
                matches_played=1,
                wins=1,
                created_at=NOW,
                updated_at=NOW,
            ),
            RatingModel(
                pk="TENANT#t1",
                sk="RATING#l1#p1",
                gsi1_pk="LEAGUE#l1",
                gsi1_sk="RATING#9000#p1",
                league_id="l1",
                player_id="p1",
                display_name="Player 1",
                elo=1180,
                matches_played=1,
                wins=0,
                created_at=NOW,
                updated_at=NOW,
            ),
        ]

        def _lb_p2_first(_lid):
            return lb

        ctx = _make_ctx()
        result = evaluate_achievements(
            ctx,
            get_unlocked=_no_unlocked,
            get_recent=_no_recent,
            get_leaderboard=_lb_p2_first,
            save=_no_save,
        )
        assert "p1:top_dog" not in result


# ── SAVE TRACKING ────────────────────────────────────────────────────────────


class TestSaving:
    def test_save_called_for_each_new_achievement(self):
        saved: list[tuple[str, str, str, str]] = []

        def _tracking_save(tid, lid, pid, atype):
            saved.append((tid, lid, pid, atype))

        ctx = _make_ctx()
        evaluate_achievements(
            ctx,
            get_unlocked=_no_unlocked,
            get_recent=_no_recent,
            get_leaderboard=_empty_leaderboard,
            save=_tracking_save,
        )
        # p1 wins -> first_blood at minimum
        assert ("t1", "l1", "p1", "first_blood") in saved


# ── 2v2 MATCH ────────────────────────────────────────────────────────────────


class TestTwoVsTwo:
    def test_both_winners_get_first_blood(self):
        match = _make_match(["p1", "p3"], ["p2", "p4"], t1_score=10, t2_score=5)
        players = {
            "p1": _make_player("p1", 1, True),
            "p3": _make_player("p3", 1, True),
            "p2": _make_player("p2", 2, False, elo_delta=-20, wins=0),
            "p4": _make_player("p4", 2, False, elo_delta=-20, wins=0),
        }
        ctx = _make_ctx(match=match, players=players)
        result = evaluate_achievements(
            ctx,
            get_unlocked=_no_unlocked,
            get_recent=_no_recent,
            get_leaderboard=_empty_leaderboard,
            save=_no_save,
        )
        assert "p1:first_blood" in result
        assert "p3:first_blood" in result
        assert "p2:first_blood" not in result
        assert "p4:first_blood" not in result


# ── LEADERBOARD BATCHING ─────────────────────────────────────────────────────


class TestLeaderboardBatching:
    def test_leaderboard_fetched_once_not_per_player(self):
        """get_leaderboard should be called exactly once, not once per player."""
        call_count = 0

        def _counting_leaderboard(_lid):
            nonlocal call_count
            call_count += 1
            return []

        match = _make_match(["p1", "p3"], ["p2", "p4"], t1_score=10, t2_score=5)
        players = {
            "p1": _make_player("p1", 1, True),
            "p3": _make_player("p3", 1, True),
            "p2": _make_player("p2", 2, False, elo_delta=-20, wins=0),
            "p4": _make_player("p4", 2, False, elo_delta=-20, wins=0),
        }
        ctx = _make_ctx(match=match, players=players)
        evaluate_achievements(
            ctx,
            get_unlocked=_no_unlocked,
            get_recent=_no_recent,
            get_leaderboard=_counting_leaderboard,
            save=_no_save,
        )
        assert call_count == 1


# ── RECENT MATCHES BATCHING ─────────────────────────────────────────────────


class TestRecentMatchesBatching:
    def test_recent_matches_called_once_per_winner(self):
        """_get_recent should be called only for winners, not losers."""
        called_for: list[str] = []

        def _tracking_recent(_lid, pid, limit=5):
            called_for.append(pid)
            return []

        match = _make_match(["p1"], ["p2"])
        players = {
            "p1": _make_player("p1", 1, True),
            "p2": _make_player("p2", 2, False, elo_delta=-20, wins=0),
        }
        ctx = _make_ctx(match=match, players=players)
        evaluate_achievements(
            ctx,
            get_unlocked=_no_unlocked,
            get_recent=_tracking_recent,
            get_leaderboard=_empty_leaderboard,
            save=_no_save,
        )
        assert "p1" in called_for
        assert "p2" not in called_for


# ── PURE HELPERS ─────────────────────────────────────────────────────────────


class TestCountWinStreak:
    def test_all_wins(self):
        matches = [
            _make_match(["p1"], ["p2"], t1_score=10, t2_score=5, match_id=f"m{i}")
            for i in range(4)
        ]
        assert _count_win_streak(matches, "p1") == 4

    def test_broken_by_loss(self):
        matches = [
            _make_match(["p1"], ["p2"], t1_score=10, t2_score=5, match_id="m1"),
            _make_match(["p1"], ["p2"], t1_score=3, t2_score=10, match_id="m2"),
            _make_match(["p1"], ["p2"], t1_score=10, t2_score=5, match_id="m3"),
        ]
        assert _count_win_streak(matches, "p1") == 1

    def test_empty_list(self):
        assert _count_win_streak([], "p1") == 0


class TestCountLowConcedeWins:
    def test_all_low_concede(self):
        matches = [
            _make_match(["p1"], ["p2"], t1_score=10, t2_score=2, match_id=f"m{i}")
            for i in range(3)
        ]
        assert _count_low_concede_wins(matches, "p1", max_concede=3) == 3

    def test_broken_by_high_concede(self):
        matches = [
            _make_match(["p1"], ["p2"], t1_score=10, t2_score=1, match_id="m1"),
            _make_match(["p1"], ["p2"], t1_score=10, t2_score=5, match_id="m2"),
            _make_match(["p1"], ["p2"], t1_score=10, t2_score=0, match_id="m3"),
        ]
        assert _count_low_concede_wins(matches, "p1", max_concede=3) == 1

    def test_empty_list(self):
        assert _count_low_concede_wins([], "p1") == 0
