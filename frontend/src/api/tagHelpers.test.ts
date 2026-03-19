import { describe, it, expect } from "vitest";
import { withEffects, withScopedEffects } from "./tagHelpers";

describe("withEffects", () => {
  it("expands Matches through full transitive chain", () => {
    const result = withEffects(["Matches"]);

    expect(result).toContain("Matches");
    expect(result).toContain("Leaderboard");
    expect(result).toContain("EloHistory");
    expect(result).toContain("Achievements");
    expect(result).toContain("Members");
    expect(result).toContain("League");
    expect(result).toContain("MyLeagues");
  });

  it("expands Members without touching Matches or Leaderboard", () => {
    const result = withEffects(["Members"]);

    expect(result).toContain("Members");
    expect(result).toContain("League");
    expect(result).toContain("MyLeagues");
    expect(result).not.toContain("Matches");
    expect(result).not.toContain("Leaderboard");
  });

  it("returns leaf tags unchanged", () => {
    expect(withEffects(["Players"])).toEqual(["Players"]);
    expect(withEffects(["EloHistory"])).toEqual(["EloHistory"]);
  });

  it("deduplicates when multiple seeds converge", () => {
    const result = withEffects(["Matches", "Members"]);
    const leagueCount = result.filter((t) => t === "League").length;
    expect(leagueCount).toBe(1);
  });
});

describe("withScopedEffects", () => {
  it("scopes league tags with id, keeps global tags bare", () => {
    const result = withScopedEffects("league-1", ["Matches"]);

    expect(result).toContainEqual({ type: "Matches", id: "league-1" });
    expect(result).toContainEqual({ type: "Leaderboard", id: "league-1" });
    expect(result).toContainEqual({ type: "Members", id: "league-1" });
    expect(result).toContainEqual({ type: "League", id: "league-1" });
    expect(result).toContain("MyLeagues");
    expect(result).toContain("EloHistory");
    expect(result).toContain("Achievements");
  });
});
