import { calculateEloPreview } from "@/shared/eloCalc";
import type {
  League,
  LeagueMember,
  Match,
  EloChange,
} from "@/projects/league/types";

import {
  DEMO_LEAGUE_1V1_ID,
  DEMO_LEAGUE_2V2_ID,
  DEMO_TENANT_ID,
  DEMO_USER_PLAYER_ID,
} from "./demoIds";

export interface DemoPlayerState {
  player_id: string;
  display_name: string;
  role: "player" | "admin";
  current_elo: number;
  matches_played: number;
  wins: number;
  losses: number;
}

export interface DemoLeagueData {
  league: League;
  players: DemoPlayerState[];
  matches: Match[];
}

const INITIAL_ELO = 1200;
const SEED_DAYS = 21;

// mulberry32 — small deterministic PRNG, ~10 LOC, no deps
const makePrng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const players1v1: Array<{ id: string; name: string; role: "player" | "admin" }> = [
  { id: DEMO_USER_PLAYER_ID, name: "You", role: "admin" },
  { id: "demo-p-marco", name: "Marco", role: "player" },
  { id: "demo-p-alice", name: "Alice", role: "player" },
  { id: "demo-p-sara", name: "Sara", role: "player" },
  { id: "demo-p-luca", name: "Luca", role: "player" },
  { id: "demo-p-giulia", name: "Giulia", role: "player" },
  { id: "demo-p-tom", name: "Tom", role: "player" },
  { id: "demo-p-priya", name: "Priya", role: "player" },
];

const players2v2: Array<{ id: string; name: string; role: "player" | "admin" }> = [
  { id: DEMO_USER_PLAYER_ID, name: "You", role: "admin" },
  { id: "demo-p-marco", name: "Marco", role: "player" },
  { id: "demo-p-alice", name: "Alice", role: "player" },
  { id: "demo-p-sara", name: "Sara", role: "player" },
  { id: "demo-p-luca", name: "Luca", role: "player" },
  { id: "demo-p-giulia", name: "Giulia", role: "player" },
  { id: "demo-p-tom", name: "Tom", role: "player" },
  { id: "demo-p-priya", name: "Priya", role: "player" },
  { id: "demo-p-diego", name: "Diego", role: "player" },
  { id: "demo-p-nora", name: "Nora", role: "player" },
];

const makeInitialPlayers = (
  source: Array<{ id: string; name: string; role: "player" | "admin" }>,
): DemoPlayerState[] =>
  source.map((p) => ({
    player_id: p.id,
    display_name: p.name,
    role: p.role,
    current_elo: INITIAL_ELO,
    matches_played: 0,
    wins: 0,
    losses: 0,
  }));

const pickN = <T,>(arr: T[], n: number, rand: () => number): T[] => {
  const pool = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(rand() * pool.length);
    out.push(pool.splice(idx, 1)[0]!);
  }
  return out;
};

const applyMatchToPlayers = (
  players: DemoPlayerState[],
  team1Ids: string[],
  team2Ids: string[],
  team1Score: number,
  team2Score: number,
): EloChange[] => {
  const team1Won = team1Score > team2Score;
  const byId = new Map(players.map((p) => [p.player_id, p]));

  const team1Input = team1Ids.map((id) => {
    const p = byId.get(id)!;
    return { id, elo: p.current_elo, matchesPlayed: p.matches_played };
  });
  const team2Input = team2Ids.map((id) => {
    const p = byId.get(id)!;
    return { id, elo: p.current_elo, matchesPlayed: p.matches_played };
  });

  const deltas = calculateEloPreview(team1Input, team2Input, team1Won);
  const changes: EloChange[] = [];

  for (const id of [...team1Ids, ...team2Ids]) {
    const p = byId.get(id)!;
    const delta = deltas.get(id) ?? 0;
    const before = p.current_elo;
    const after = before + delta;
    changes.push({
      player_id: id,
      display_name: p.display_name,
      elo_before: before,
      elo_after: after,
      delta,
    });
    p.current_elo = after;
    p.matches_played += 1;
    const won =
      (team1Ids.includes(id) && team1Won) ||
      (team2Ids.includes(id) && !team1Won);
    if (won) p.wins += 1;
    else p.losses += 1;
  }

  return changes;
};

const buildMatches = (
  leagueId: string,
  players: DemoPlayerState[],
  teamSize: 1 | 2,
  count: number,
  rand: () => number,
): Match[] => {
  const matches: Match[] = [];
  const now = Date.now();
  const spreadMs = SEED_DAYS * 24 * 60 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    const picked = pickN(players, teamSize * 2, rand);
    const team1 = picked.slice(0, teamSize).map((p) => p.player_id);
    const team2 = picked.slice(teamSize).map((p) => p.player_id);

    // Score: winner gets 10, loser 5-9
    const team1Wins = rand() < 0.5;
    const team1Score = team1Wins ? 10 : Math.floor(5 + rand() * 5);
    const team2Score = team1Wins ? Math.floor(5 + rand() * 5) : 10;

    const elo_changes = applyMatchToPlayers(
      players,
      team1,
      team2,
      team1Score,
      team2Score,
    );

    // Spread timestamps oldest → newest across SEED_DAYS
    const createdAt = new Date(now - spreadMs + (i / count) * spreadMs).toISOString();

    matches.push({
      match_id: `${leagueId}-m${i + 1}`,
      league_id: leagueId,
      team1_player_ids: team1,
      team2_player_ids: team2,
      team1_score: team1Score,
      team2_score: team2Score,
      status: "CONFIRMED",
      submitted_by: team1[0]!,
      elo_changes,
      created_at: createdAt,
    });
  }

  // Return newest-first to match real API
  return matches.reverse();
};

const buildLeague = (
  leagueId: string,
  name: string,
  description: string,
  type: "1v1" | "2v2",
  players: DemoPlayerState[],
  matchCount: number,
): League => ({
  league_id: leagueId,
  name,
  league_type: type,
  initial_elo: INITIAL_ELO,
  description,
  tenant_id: DEMO_TENANT_ID,
  member_count: players.length,
  match_count: matchCount,
});

export const toLeagueMember = (p: DemoPlayerState): LeagueMember => ({
  player_id: p.player_id,
  display_name: p.display_name,
  role: p.role,
  current_elo: p.current_elo,
});

export const buildDemoSeed = (): {
  [DEMO_LEAGUE_1V1_ID]: DemoLeagueData;
  [DEMO_LEAGUE_2V2_ID]: DemoLeagueData;
} => {
  // Two independent PRNGs so seeds stay decoupled
  const p1v1 = makeInitialPlayers(players1v1);
  const matches1v1 = buildMatches(DEMO_LEAGUE_1V1_ID, p1v1, 1, 22, makePrng(42));

  const p2v2 = makeInitialPlayers(players2v2);
  const matches2v2 = buildMatches(DEMO_LEAGUE_2V2_ID, p2v2, 2, 18, makePrng(7));

  return {
    [DEMO_LEAGUE_1V1_ID]: {
      league: buildLeague(
        DEMO_LEAGUE_1V1_ID,
        "Office 1v1",
        "Demo league — head to head 1v1",
        "1v1",
        p1v1,
        matches1v1.length,
      ),
      players: p1v1,
      matches: matches1v1,
    },
    [DEMO_LEAGUE_2V2_ID]: {
      league: buildLeague(
        DEMO_LEAGUE_2V2_ID,
        "Office 2v2",
        "Demo league — classic foosball doubles",
        "2v2",
        p2v2,
        matches2v2.length,
      ),
      players: p2v2,
      matches: matches2v2,
    },
  };
};
