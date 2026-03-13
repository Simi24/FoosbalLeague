"""Unit tests for ELO rating calculations."""

from services.elo_service import calculate_elo_changes, expected_score, get_k_factor


class TestKFactor:
    def test_new_player(self):
        assert get_k_factor(0) == 40
        assert get_k_factor(5) == 40
        assert get_k_factor(10) == 40

    def test_settling_player(self):
        assert get_k_factor(11) == 32
        assert get_k_factor(20) == 32
        assert get_k_factor(30) == 32

    def test_established_player(self):
        assert get_k_factor(31) == 24
        assert get_k_factor(100) == 24
        assert get_k_factor(1000) == 24


class TestExpectedScore:
    def test_equal_elos(self):
        result = expected_score(1200, 1200)
        assert abs(result - 0.5) < 0.001

    def test_higher_elo_favored(self):
        result = expected_score(1400, 1200)
        assert result > 0.5

    def test_lower_elo_underdog(self):
        result = expected_score(1200, 1400)
        assert result < 0.5

    def test_symmetry(self):
        e1 = expected_score(1200, 1400)
        e2 = expected_score(1400, 1200)
        assert abs(e1 + e2 - 1.0) < 0.001

    def test_400_point_difference(self):
        """400 point gap -> ~91% expected for stronger team."""
        result = expected_score(1600, 1200)
        assert abs(result - 0.909) < 0.01


class TestCalculateEloChanges:
    def test_equal_teams_team1_wins(self):
        """Equal teams, team1 wins -> positive delta for team1."""
        team1 = [("p1", 1200, 0), ("p2", 1200, 0)]
        team2 = [("p3", 1200, 0), ("p4", 1200, 0)]
        changes = calculate_elo_changes(team1, team2, 10, 5)

        assert changes["p1"] > 0
        assert changes["p2"] > 0
        assert changes["p3"] < 0
        assert changes["p4"] < 0

    def test_equal_teams_team2_wins(self):
        """Equal teams, team2 wins -> positive delta for team2."""
        team1 = [("p1", 1200, 0), ("p2", 1200, 0)]
        team2 = [("p3", 1200, 0), ("p4", 1200, 0)]
        changes = calculate_elo_changes(team1, team2, 5, 10)

        assert changes["p1"] < 0
        assert changes["p2"] < 0
        assert changes["p3"] > 0
        assert changes["p4"] > 0

    def test_upset_gives_larger_delta(self):
        """Underdog winning gives larger ELO swing."""
        team1_strong = [("p1", 1400, 0)]
        team2_weak = [("p2", 1000, 0)]

        # Expected outcome: strong wins
        normal = calculate_elo_changes(team1_strong, team2_weak, 10, 5)

        # Upset: weak wins
        upset = calculate_elo_changes(team1_strong, team2_weak, 5, 10)

        # Upset winner gains more than normal winner
        assert abs(upset["p2"]) > abs(normal["p1"])

    def test_1v1_degenerate_case(self):
        """1v1 is just a team of 1."""
        team1 = [("p1", 1200, 50)]
        team2 = [("p2", 1200, 50)]
        changes = calculate_elo_changes(team1, team2, 1, 0)

        assert changes["p1"] == 12  # K=24, S-E = 1.0-0.5 = 0.5, 24*0.5 = 12
        assert changes["p2"] == -12

    def test_different_k_factors(self):
        """Players with different games played get different K-factors."""
        team1 = [("new", 1200, 5)]   # K=40
        team2 = [("vet", 1200, 50)]  # K=24
        changes = calculate_elo_changes(team1, team2, 10, 5)

        # New player gains more than veteran loses (different K)
        assert changes["new"] == 20  # K=40, 40*0.5 = 20
        assert changes["vet"] == -12  # K=24, 24*(-0.5) = -12

    def test_2v2_mixed_elos(self):
        """2v2 with mixed team ELOs."""
        team1 = [("p1", 1300, 20), ("p2", 1100, 20)]  # avg 1200
        team2 = [("p3", 1200, 20), ("p4", 1200, 20)]  # avg 1200
        changes = calculate_elo_changes(team1, team2, 10, 5)

        # Equal team averages -> same delta for all (same K)
        assert changes["p1"] == changes["p2"]
        assert changes["p3"] == changes["p4"]

    def test_draw(self):
        """Draw scenario (equal scores)."""
        team1 = [("p1", 1200, 50)]
        team2 = [("p2", 1200, 50)]
        changes = calculate_elo_changes(team1, team2, 5, 5)

        # Equal ELO draw -> no change
        assert changes["p1"] == 0
        assert changes["p2"] == 0

    def test_draw_different_elos(self):
        """Draw with different ELOs - higher rated loses points."""
        team1 = [("p1", 1400, 50)]
        team2 = [("p2", 1000, 50)]
        changes = calculate_elo_changes(team1, team2, 5, 5)

        # Higher rated player expected to win, draw = underperformance
        assert changes["p1"] < 0
        assert changes["p2"] > 0
