import type { FetchArgs } from "@reduxjs/toolkit/query";

import type { RootState, AppDispatch } from "@/app/store";
import {
  recordDemoMatch,
  selectDemoAchievements,
  selectDemoEloHistory,
  selectDemoInsights,
  selectDemoLeaderboard,
  selectDemoLeague,
  selectDemoMatches,
  selectDemoMembers,
  selectDemoMyLeagues,
  selectDemoPlayer,
} from "./demoSlice";

interface DemoHandlerResult {
  data?: unknown;
  error?: { status: number; data: unknown };
}

interface NormalizedArgs {
  url: string;
  method: string;
  body: unknown;
}

const normalize = (args: string | FetchArgs): NormalizedArgs => {
  if (typeof args === "string") return { url: args, method: "GET", body: undefined };
  return {
    url: args.url,
    method: (args.method ?? "GET").toUpperCase(),
    body: args.body,
  };
};

const parseUrl = (url: string): { path: string; query: URLSearchParams } => {
  const [path, qs] = url.split("?", 2);
  return { path: path!, query: new URLSearchParams(qs ?? "") };
};

const ok = (data: unknown): DemoHandlerResult => ({ data });
const noContent = (): DemoHandlerResult => ({ data: null });
const notFound = (msg: string): DemoHandlerResult => ({
  error: { status: 404, data: { detail: msg } },
});
const notSupported = (): DemoHandlerResult => ({
  error: { status: 501, data: { detail: "Not available in demo mode" } },
});

export const handleDemoQuery = (
  args: string | FetchArgs,
  state: RootState,
  dispatch: AppDispatch,
): DemoHandlerResult => {
  const { url, method, body } = normalize(args);
  const { path } = parseUrl(url);

  // ── GET ───────────────────────────────────────────────────────────
  if (method === "GET") {
    if (path === "/leagues/my") return ok(selectDemoMyLeagues(state));

    const m1 = path.match(/^\/leagues\/([^/]+)$/);
    if (m1) {
      const league = selectDemoLeague(state, m1[1]!);
      return league ? ok(league) : notFound("League not found");
    }

    const m2 = path.match(/^\/leagues\/([^/]+)\/members$/);
    if (m2) return ok(selectDemoMembers(state, m2[1]!));

    const m3 = path.match(/^\/matches\/league\/([^/]+)$/);
    if (m3) return ok(selectDemoMatches(state, m3[1]!));

    const m4 = path.match(/^\/rankings\/league\/([^/]+)$/);
    if (m4) {
      const lb = selectDemoLeaderboard(state, m4[1]!);
      return lb ? ok(lb) : notFound("Leaderboard not found");
    }

    const m5 = path.match(/^\/rankings\/player\/([^/]+)\/history$/);
    if (m5) {
      const { query } = parseUrl(url);
      const leagueId = query.get("league_id") ?? "";
      return ok({ history: selectDemoEloHistory(state, m5[1]!, leagueId) });
    }

    if (path === "/players/") return ok([]);

    const m6 = path.match(/^\/players\/([^/]+)\/insights$/);
    if (m6) {
      const { query } = parseUrl(url);
      const leagueId = query.get("league_id") ?? "";
      const insights = selectDemoInsights(state, m6[1]!, leagueId);
      return insights ? ok(insights) : notFound("Insights not found");
    }

    const m7 = path.match(/^\/players\/([^/]+)$/);
    if (m7) {
      const p = selectDemoPlayer(state, m7[1]!);
      return p ? ok(p) : notFound("Player not found");
    }

    const m8 = path.match(/^\/achievements\/player\/([^/]+)$/);
    if (m8) {
      const { query } = parseUrl(url);
      const leagueId = query.get("league_id") ?? "";
      return ok({ achievements: selectDemoAchievements(state, m8[1]!, leagueId) });
    }

    if (path === "/notifications") return ok({ notifications: [], unread_count: 0 });
  }

  // ── POST ──────────────────────────────────────────────────────────
  if (method === "POST") {
    if (path === "/matches/") {
      dispatch(recordDemoMatch(body as Parameters<typeof recordDemoMatch>[0]));
      return noContent();
    }
    if (path === "/auth/register") return noContent();
    if (
      path.startsWith("/notifications/") ||
      path === "/notifications/read-all"
    ) {
      return noContent();
    }
  }

  // Mutations that change demo state in ways we don't simulate: join, leave,
  // kick, promote, demote, regenerate, confirm/dispute/delete match,
  // league CRUD. Return a friendly 501 so the UI surfaces the error.
  return notSupported();
};
