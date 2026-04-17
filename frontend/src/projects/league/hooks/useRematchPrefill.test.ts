import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRematchPrefill } from "./useRematchPrefill";
import type { Match } from "../types";

const makeMatch = (overrides: Partial<Match>): Match => ({
  match_id: overrides.match_id ?? "m",
  league_id: overrides.league_id ?? "l",
  team1_player_ids: overrides.team1_player_ids ?? [],
  team2_player_ids: overrides.team2_player_ids ?? [],
  team1_score: overrides.team1_score ?? 10,
  team2_score: overrides.team2_score ?? 5,
  status: overrides.status ?? "CONFIRMED",
  submitted_by: overrides.submitted_by ?? "x",
  elo_changes: overrides.elo_changes ?? [],
  created_at: overrides.created_at ?? "2026-01-01T00:00:00Z",
});

describe("useRematchPrefill", () => {
  it("returns null when currentPlayerId is null", () => {
    const { result } = renderHook(() =>
      useRematchPrefill({
        currentPlayerId: null,
        matches: [makeMatch({ team1_player_ids: ["a"], team2_player_ids: ["b"] })],
        memberIds: new Set(["a", "b"]),
      }),
    );
    expect(result.current).toBeNull();
  });

  it("returns null when user never participated", () => {
    const { result } = renderHook(() =>
      useRematchPrefill({
        currentPlayerId: "me",
        matches: [makeMatch({ team1_player_ids: ["a"], team2_player_ids: ["b"] })],
        memberIds: new Set(["a", "b", "me"]),
      }),
    );
    expect(result.current).toBeNull();
  });

  it("returns null when no matches at all", () => {
    const { result } = renderHook(() =>
      useRematchPrefill({
        currentPlayerId: "me",
        matches: [],
        memberIds: new Set(["me"]),
      }),
    );
    expect(result.current).toBeNull();
  });

  it("returns most recent match in which user participated", () => {
    const older = makeMatch({
      match_id: "m1",
      team1_player_ids: ["me", "x"],
      team2_player_ids: ["y", "z"],
      created_at: "2026-01-01T00:00:00Z",
    });
    const newer = makeMatch({
      match_id: "m2",
      team1_player_ids: ["me", "x"],
      team2_player_ids: ["y", "z"],
      created_at: "2026-02-01T00:00:00Z",
    });
    const { result } = renderHook(() =>
      useRematchPrefill({
        currentPlayerId: "me",
        matches: [older, newer],
        memberIds: new Set(["me", "x", "y", "z"]),
      }),
    );
    expect(result.current?.lastMatch.match_id).toBe("m2");
  });

  it("preserves team sides as they were in the source match", () => {
    const match = makeMatch({
      team1_player_ids: ["a", "b"],
      team2_player_ids: ["c", "d"],
    });
    const { result } = renderHook(() =>
      useRematchPrefill({
        currentPlayerId: "a",
        matches: [match],
        memberIds: new Set(["a", "b", "c", "d"]),
      }),
    );
    expect(result.current?.team1).toEqual(["a", "b"]);
    expect(result.current?.team2).toEqual(["c", "d"]);
  });

  it("maps missing-now members to null slots and flags hasMissing", () => {
    const match = makeMatch({
      team1_player_ids: ["a", "gone"],
      team2_player_ids: ["c", "d"],
    });
    const { result } = renderHook(() =>
      useRematchPrefill({
        currentPlayerId: "a",
        matches: [match],
        memberIds: new Set(["a", "c", "d"]),
      }),
    );
    expect(result.current?.team1).toEqual(["a", null]);
    expect(result.current?.team2).toEqual(["c", "d"]);
    expect(result.current?.hasMissing).toBe(true);
  });

  it("hasMissing is false when every slot resolves", () => {
    const match = makeMatch({
      team1_player_ids: ["a"],
      team2_player_ids: ["b"],
    });
    const { result } = renderHook(() =>
      useRematchPrefill({
        currentPlayerId: "a",
        matches: [match],
        memberIds: new Set(["a", "b"]),
      }),
    );
    expect(result.current?.hasMissing).toBe(false);
  });

  it("ignores matches where user is not on either team even if more recent", () => {
    const recentOther = makeMatch({
      match_id: "other",
      team1_player_ids: ["x"],
      team2_player_ids: ["y"],
      created_at: "2026-03-01T00:00:00Z",
    });
    const mine = makeMatch({
      match_id: "mine",
      team1_player_ids: ["me"],
      team2_player_ids: ["y"],
      created_at: "2026-01-01T00:00:00Z",
    });
    const { result } = renderHook(() =>
      useRematchPrefill({
        currentPlayerId: "me",
        matches: [recentOther, mine],
        memberIds: new Set(["me", "x", "y"]),
      }),
    );
    expect(result.current?.lastMatch.match_id).toBe("mine");
  });

  it("does not expose scores separately — component must not copy them", () => {
    const match = makeMatch({
      team1_player_ids: ["me"],
      team2_player_ids: ["b"],
      team1_score: 10,
      team2_score: 3,
    });
    const { result } = renderHook(() =>
      useRematchPrefill({
        currentPlayerId: "me",
        matches: [match],
        memberIds: new Set(["me", "b"]),
      }),
    );
    expect(result.current).toMatchObject({
      team1: ["me"],
      team2: ["b"],
      hasMissing: false,
    });
    // lastMatch still carries scores (needed for display), but team1/team2 arrays do not.
    expect(result.current?.lastMatch.team1_score).toBe(10);
  });
});
