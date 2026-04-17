import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useMatchFormState } from "./useMatchFormState";

describe("useMatchFormState", () => {
  it("initializes 1v1 with 1 null slot per team and empty scores", () => {
    const { result } = renderHook(() => useMatchFormState("1v1"));
    expect(result.current.maxPerTeam).toBe(1);
    expect(result.current.team1).toEqual([null]);
    expect(result.current.team2).toEqual([null]);
    expect(result.current.score1).toBe("");
    expect(result.current.score2).toBe("");
    expect(result.current.canSubmit).toBe(false);
    expect(result.current.teamsReady).toBe(false);
  });

  it("initializes 2v2 with 2 null slots per team", () => {
    const { result } = renderHook(() => useMatchFormState("2v2"));
    expect(result.current.maxPerTeam).toBe(2);
    expect(result.current.team1).toEqual([null, null]);
    expect(result.current.team2).toEqual([null, null]);
  });

  it("assigns player to first empty slot when slotIndex omitted", () => {
    const { result } = renderHook(() => useMatchFormState("2v2"));
    act(() => result.current.assignToSlot(1, "alice"));
    expect(result.current.team1).toEqual(["alice", null]);
    act(() => result.current.assignToSlot(1, "bob"));
    expect(result.current.team1).toEqual(["alice", "bob"]);
  });

  it("assigns to explicit slot index when provided", () => {
    const { result } = renderHook(() => useMatchFormState("2v2"));
    act(() => result.current.assignToSlot(1, "alice", 1));
    expect(result.current.team1).toEqual([null, "alice"]);
  });

  it("reassigning player already in other team removes them from old team", () => {
    const { result } = renderHook(() => useMatchFormState("2v2"));
    act(() => result.current.assignToSlot(1, "alice"));
    act(() => result.current.assignToSlot(2, "alice"));
    expect(result.current.team1).toEqual([null, null]);
    expect(result.current.team2).toEqual(["alice", null]);
  });

  it("team full: assign with no explicit slot is a no-op", () => {
    const { result } = renderHook(() => useMatchFormState("1v1"));
    act(() => result.current.assignToSlot(1, "alice"));
    act(() => result.current.assignToSlot(1, "bob"));
    expect(result.current.team1).toEqual(["alice"]);
  });

  it("removeFromSlot leaves null without reflowing other slots", () => {
    const { result } = renderHook(() => useMatchFormState("2v2"));
    act(() => result.current.assignToSlot(1, "alice"));
    act(() => result.current.assignToSlot(1, "bob"));
    act(() => result.current.removeFromSlot(1, 0));
    expect(result.current.team1).toEqual([null, "bob"]);
  });

  it("teamsReady true only when all slots filled in both teams", () => {
    const { result } = renderHook(() => useMatchFormState("2v2"));
    act(() => result.current.assignToSlot(1, "a"));
    act(() => result.current.assignToSlot(1, "b"));
    expect(result.current.teamsReady).toBe(false);
    act(() => result.current.assignToSlot(2, "c"));
    act(() => result.current.assignToSlot(2, "d"));
    expect(result.current.teamsReady).toBe(true);
  });

  it("canSubmit requires teamsReady + valid non-equal scores", () => {
    const { result } = renderHook(() => useMatchFormState("1v1"));
    act(() => result.current.assignToSlot(1, "a"));
    act(() => result.current.assignToSlot(2, "b"));
    act(() => result.current.setScore1("10"));
    expect(result.current.canSubmit).toBe(false);
    act(() => result.current.setScore2("10"));
    expect(result.current.canSubmit).toBe(false);
    expect(result.current.tieError).toBe(true);
    act(() => result.current.setScore2("8"));
    expect(result.current.canSubmit).toBe(true);
    expect(result.current.tieError).toBe(false);
  });

  it("rejects non-integer score strings in scoresReady", () => {
    const { result } = renderHook(() => useMatchFormState("1v1"));
    act(() => result.current.assignToSlot(1, "a"));
    act(() => result.current.assignToSlot(2, "b"));
    act(() => result.current.setScore1("1.5"));
    act(() => result.current.setScore2("2"));
    expect(result.current.scoresReady).toBe(false);
    act(() => result.current.setScore1("-1"));
    expect(result.current.scoresReady).toBe(false);
    act(() => result.current.setScore1("abc"));
    expect(result.current.scoresReady).toBe(false);
  });

  it("removing a player drops teamsReady when it empties a slot", () => {
    const { result } = renderHook(() => useMatchFormState("1v1"));
    act(() => result.current.assignToSlot(1, "a"));
    act(() => result.current.assignToSlot(2, "b"));
    act(() => result.current.setScore1("10"));
    act(() => result.current.setScore2("5"));
    expect(result.current.canSubmit).toBe(true);
    act(() => result.current.removeFromSlot(1, 0));
    expect(result.current.teamsReady).toBe(false);
    expect(result.current.canSubmit).toBe(false);
  });

  it("playerTeam reports which team a player is on", () => {
    const { result } = renderHook(() => useMatchFormState("2v2"));
    act(() => result.current.assignToSlot(1, "a"));
    act(() => result.current.assignToSlot(2, "b"));
    expect(result.current.playerTeam("a")).toBe(1);
    expect(result.current.playerTeam("b")).toBe(2);
    expect(result.current.playerTeam("c")).toBe(null);
  });

  it("prefillTeams fills both sides preserving nulls and respecting maxPerTeam", () => {
    const { result } = renderHook(() => useMatchFormState("2v2"));
    act(() => result.current.prefillTeams(["a", "b"], ["c", null]));
    expect(result.current.team1).toEqual(["a", "b"]);
    expect(result.current.team2).toEqual(["c", null]);
    expect(result.current.team2Ids).toEqual(["c"]);
  });

  it("prefillTeams pads short arrays with nulls", () => {
    const { result } = renderHook(() => useMatchFormState("2v2"));
    act(() => result.current.prefillTeams(["a"], []));
    expect(result.current.team1).toEqual(["a", null]);
    expect(result.current.team2).toEqual([null, null]);
  });

  it("team1Ids and team2Ids expose compact non-null arrays", () => {
    const { result } = renderHook(() => useMatchFormState("2v2"));
    act(() => result.current.assignToSlot(1, "a"));
    act(() => result.current.assignToSlot(1, "b"));
    act(() => result.current.removeFromSlot(1, 0));
    expect(result.current.team1).toEqual([null, "b"]);
    expect(result.current.team1Ids).toEqual(["b"]);
  });

  it("reset clears teams and scores", () => {
    const { result } = renderHook(() => useMatchFormState("2v2"));
    act(() => result.current.assignToSlot(1, "a"));
    act(() => result.current.setScore1("5"));
    act(() => result.current.reset());
    expect(result.current.team1).toEqual([null, null]);
    expect(result.current.score1).toBe("");
  });
});
