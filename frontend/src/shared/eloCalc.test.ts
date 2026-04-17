import { describe, it, expect } from "vitest";
import { calculateEloPreview } from "./eloCalc";

describe("calculateEloPreview", () => {
  it("returns correct deltas for 1v1 equal ELO established players", () => {
    const team1 = [{ id: "p1", elo: 1200, matchesPlayed: 50 }];
    const team2 = [{ id: "p2", elo: 1200, matchesPlayed: 50 }];

    const result = calculateEloPreview(team1, team2, true);

    // K=24, expected=0.5, actual=1.0, delta=24*(1.0-0.5)=12
    expect(result.get("p1")).toBe(12);
    expect(result.get("p2")).toBe(-12);
  });

  it("applies different K-factors based on matches played", () => {
    const team1 = [{ id: "new", elo: 1200, matchesPlayed: 5 }]; // K=40
    const team2 = [{ id: "vet", elo: 1200, matchesPlayed: 50 }]; // K=24

    const result = calculateEloPreview(team1, team2, true);

    expect(result.get("new")).toBe(20); // 40*0.5=20
    expect(result.get("vet")).toBe(-12); // 24*(-0.5)=-12
  });

  it("handles 2v2 with mixed ELOs (equal team averages)", () => {
    const team1 = [
      { id: "p1", elo: 1300, matchesPlayed: 20 },
      { id: "p2", elo: 1100, matchesPlayed: 20 },
    ]; // avg 1200
    const team2 = [
      { id: "p3", elo: 1200, matchesPlayed: 20 },
      { id: "p4", elo: 1200, matchesPlayed: 20 },
    ]; // avg 1200

    const result = calculateEloPreview(team1, team2, true);

    // Same K, equal averages => same delta for teammates
    expect(result.get("p1")).toBe(result.get("p2"));
    expect(result.get("p3")).toBe(result.get("p4"));
  });

  it("gives larger delta for upsets", () => {
    const strong = [{ id: "p1", elo: 1400, matchesPlayed: 0 }];
    const weak = [{ id: "p2", elo: 1000, matchesPlayed: 0 }];

    const normal = calculateEloPreview(strong, weak, true); // expected outcome
    const upset = calculateEloPreview(strong, weak, false); // upset

    // Upset winner gains more than normal winner
    expect(Math.abs(upset.get("p2")!)).toBeGreaterThan(Math.abs(normal.get("p1")!));
  });

  it("returns zero change for equal-ELO draw (null = no result)", () => {
    const team1 = [{ id: "p1", elo: 1200, matchesPlayed: 50 }];
    const team2 = [{ id: "p2", elo: 1200, matchesPlayed: 50 }];

    const result = calculateEloPreview(team1, team2, null);

    // null means no result yet => empty map
    expect(result.size).toBe(0);
  });

  it("returns empty map when a team is empty", () => {
    const team1 = [{ id: "p1", elo: 1200, matchesPlayed: 50 }];

    expect(calculateEloPreview(team1, [], true).size).toBe(0);
    expect(calculateEloPreview([], team1, true).size).toBe(0);
  });

  it("handles 2v2 team1 wins — positive for team1, negative for team2", () => {
    const team1 = [
      { id: "p1", elo: 1200, matchesPlayed: 0 },
      { id: "p2", elo: 1200, matchesPlayed: 0 },
    ];
    const team2 = [
      { id: "p3", elo: 1200, matchesPlayed: 0 },
      { id: "p4", elo: 1200, matchesPlayed: 0 },
    ];

    const result = calculateEloPreview(team1, team2, true);

    expect(result.get("p1")!).toBeGreaterThan(0);
    expect(result.get("p2")!).toBeGreaterThan(0);
    expect(result.get("p3")!).toBeLessThan(0);
    expect(result.get("p4")!).toBeLessThan(0);
  });

  it("mirrored outcome produces equal-magnitude, opposite-sign deltas (equal ELO)", () => {
    const team1 = [{ id: "a", elo: 1200, matchesPlayed: 20 }];
    const team2 = [{ id: "b", elo: 1200, matchesPlayed: 20 }];

    const aWins = calculateEloPreview(team1, team2, true);
    const bWins = calculateEloPreview(team1, team2, false);

    expect(aWins.get("a")).toBe(-bWins.get("a")!);
    expect(aWins.get("b")).toBe(-bWins.get("b")!);
    // Also check magnitude: at equal ELO, K=32, delta=16
    expect(Math.abs(aWins.get("a")!)).toBe(16);
  });

  it("K-factor boundary: 10 matches uses K=40, 11 matches uses K=32", () => {
    const opp = [{ id: "opp", elo: 1200, matchesPlayed: 50 }];
    const at10 = calculateEloPreview(
      [{ id: "p", elo: 1200, matchesPlayed: 10 }],
      opp,
      true,
    );
    const at11 = calculateEloPreview(
      [{ id: "p", elo: 1200, matchesPlayed: 11 }],
      opp,
      true,
    );

    // Equal ELO, win → expected 0.5, delta = K * 0.5
    expect(at10.get("p")).toBe(20); // 40 * 0.5
    expect(at11.get("p")).toBe(16); // 32 * 0.5
  });

  it("K-factor boundary: 30 matches uses K=32, 31 matches uses K=24", () => {
    const opp = [{ id: "opp", elo: 1200, matchesPlayed: 50 }];
    const at30 = calculateEloPreview(
      [{ id: "p", elo: 1200, matchesPlayed: 30 }],
      opp,
      true,
    );
    const at31 = calculateEloPreview(
      [{ id: "p", elo: 1200, matchesPlayed: 31 }],
      opp,
      true,
    );

    expect(at30.get("p")).toBe(16); // 32 * 0.5
    expect(at31.get("p")).toBe(12); // 24 * 0.5
  });
});
