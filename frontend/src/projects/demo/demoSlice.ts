import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { calculateEloPreview } from "@/shared/eloCalc";
import type {
  Achievement,
  EloChange,
  EloHistoryPoint,
  Leaderboard,
  LeagueMember,
  Match,
  MyLeague,
  Player,
  PlayerInsights,
  RankingEntry,
} from "@/projects/league/types";

import {
  DEMO_LEAGUE_1V1_ID,
  DEMO_LEAGUE_2V2_ID,
  DEMO_USER_PLAYER_ID,
} from "./demoIds";
import {
  buildDemoSeed,
  toLeagueMember,
  type DemoLeagueData,
  type DemoPlayerState,
} from "./demoSeed";

type DemoLeagueId = typeof DEMO_LEAGUE_1V1_ID | typeof DEMO_LEAGUE_2V2_ID;

interface DemoState {
  isDemoMode: boolean;
  leagues: Record<DemoLeagueId, DemoLeagueData>;
  matchesRecordedByUser: number;
  nudgeDismissed: boolean;
}

const buildInitialState = (): DemoState => ({
  isDemoMode: false,
  leagues: buildDemoSeed(),
  matchesRecordedByUser: 0,
  nudgeDismissed: false,
});

interface RecordMatchPayload {
  league_id: string;
  team1: { player_ids: string[]; score: number };
  team2: { player_ids: string[]; score: number };
}

export const demoSlice = createSlice({
  name: "demo",
  initialState: buildInitialState(),
  reducers: {
    enterDemo: (state) => {
      state.isDemoMode = true;
    },
    exitDemo: () => buildInitialState(),
    resetDemo: (state) => {
      const wasDemoMode = state.isDemoMode;
      const fresh = buildInitialState();
      fresh.isDemoMode = wasDemoMode;
      return fresh;
    },
    dismissNudge: (state) => {
      state.nudgeDismissed = true;
    },
    recordDemoMatch: (state, action: PayloadAction<RecordMatchPayload>) => {
      const { league_id, team1, team2 } = action.payload;
      const data = state.leagues[league_id as DemoLeagueId];
      if (!data) return;

      const team1Won = team1.score > team2.score;
      const byId = new Map(data.players.map((p) => [p.player_id, p]));

      const team1Input = team1.player_ids.map((id) => {
        const p = byId.get(id)!;
        return { id, elo: p.current_elo, matchesPlayed: p.matches_played };
      });
      const team2Input = team2.player_ids.map((id) => {
        const p = byId.get(id)!;
        return { id, elo: p.current_elo, matchesPlayed: p.matches_played };
      });

      const deltas = calculateEloPreview(team1Input, team2Input, team1Won);
      const elo_changes: EloChange[] = [];

      for (const id of [...team1.player_ids, ...team2.player_ids]) {
        const p = byId.get(id)!;
        const delta = deltas.get(id) ?? 0;
        elo_changes.push({
          player_id: id,
          display_name: p.display_name,
          elo_before: p.current_elo,
          elo_after: p.current_elo + delta,
          delta,
        });
        p.current_elo += delta;
        p.matches_played += 1;
        const won =
          (team1.player_ids.includes(id) && team1Won) ||
          (team2.player_ids.includes(id) && !team1Won);
        if (won) p.wins += 1;
        else p.losses += 1;
      }

      const newMatch: Match = {
        match_id: `${league_id}-m-${Date.now()}`,
        league_id,
        team1_player_ids: team1.player_ids,
        team2_player_ids: team2.player_ids,
        team1_score: team1.score,
        team2_score: team2.score,
        status: "CONFIRMED",
        submitted_by: DEMO_USER_PLAYER_ID,
        elo_changes,
        created_at: new Date().toISOString(),
      };

      data.matches = [newMatch, ...data.matches];
      data.league.match_count = data.matches.length;

      if (
        team1.player_ids.includes(DEMO_USER_PLAYER_ID) ||
        team2.player_ids.includes(DEMO_USER_PLAYER_ID)
      ) {
        state.matchesRecordedByUser += 1;
      }
    },
  },
});

export const {
  enterDemo,
  exitDemo,
  resetDemo,
  dismissNudge,
  recordDemoMatch,
} = demoSlice.actions;

// ── Selector helpers (raw, no memoization needed for the demo scale) ──

const playerToPlayerResponse = (
  p: DemoPlayerState,
  tenantId: string,
): Player => ({
  player_id: p.player_id,
  display_name: p.display_name,
  email: p.player_id === DEMO_USER_PLAYER_ID ? "you@demo.foosrank" : undefined,
  tenant_id: tenantId,
  total_matches: p.matches_played,
  total_wins: p.wins,
  total_losses: p.losses,
});

const sortPlayersByElo = (players: DemoPlayerState[]): DemoPlayerState[] =>
  [...players].sort((a, b) => b.current_elo - a.current_elo);

interface DemoStateLike {
  demo: DemoState;
}

export const selectIsDemoMode = (state: DemoStateLike): boolean =>
  state.demo.isDemoMode;

export const selectMatchesRecordedByUser = (state: DemoStateLike): number =>
  state.demo.matchesRecordedByUser;

export const selectNudgeDismissed = (state: DemoStateLike): boolean =>
  state.demo.nudgeDismissed;

export const selectDemoMyLeagues = (state: DemoStateLike): MyLeague[] => {
  const out: MyLeague[] = [];
  for (const id of [DEMO_LEAGUE_1V1_ID, DEMO_LEAGUE_2V2_ID] as DemoLeagueId[]) {
    const data = state.demo.leagues[id];
    const me = data.players.find((p) => p.player_id === DEMO_USER_PLAYER_ID);
    out.push({
      league_id: data.league.league_id,
      name: data.league.name,
      league_type: data.league.league_type,
      description: data.league.description,
      member_count: data.league.member_count,
      match_count: data.league.match_count,
      role: me?.role ?? "player",
      current_elo: me?.current_elo ?? 1200,
      invite_code: null,
    });
  }
  return out;
};

const getLeague = (state: DemoStateLike, leagueId: string): DemoLeagueData | null =>
  state.demo.leagues[leagueId as DemoLeagueId] ?? null;

export const selectDemoLeague = (state: DemoStateLike, leagueId: string) => {
  const data = getLeague(state, leagueId);
  return data ? data.league : null;
};

export const selectDemoMembers = (
  state: DemoStateLike,
  leagueId: string,
): LeagueMember[] => {
  const data = getLeague(state, leagueId);
  return data ? data.players.map(toLeagueMember) : [];
};

export const selectDemoMatches = (
  state: DemoStateLike,
  leagueId: string,
): Match[] => {
  const data = getLeague(state, leagueId);
  return data ? data.matches : [];
};

export const selectDemoLeaderboard = (
  state: DemoStateLike,
  leagueId: string,
): Leaderboard | null => {
  const data = getLeague(state, leagueId);
  if (!data) return null;
  const sorted = sortPlayersByElo(data.players);
  const entries: RankingEntry[] = sorted.map((p, idx) => ({
    rank: idx + 1,
    player_id: p.player_id,
    display_name: p.display_name,
    elo: p.current_elo,
    matches_played: p.matches_played,
    wins: p.wins,
    losses: p.losses,
    win_rate: p.matches_played > 0 ? p.wins / p.matches_played : 0,
  }));
  return {
    league_id: data.league.league_id,
    league_name: data.league.name,
    entries,
  };
};

export const selectDemoPlayer = (
  state: DemoStateLike,
  playerId: string,
): Player | null => {
  for (const id of [DEMO_LEAGUE_1V1_ID, DEMO_LEAGUE_2V2_ID] as DemoLeagueId[]) {
    const data = state.demo.leagues[id];
    const p = data.players.find((x) => x.player_id === playerId);
    if (p) return playerToPlayerResponse(p, data.league.tenant_id);
  }
  return null;
};

export const selectDemoEloHistory = (
  state: DemoStateLike,
  playerId: string,
  leagueId: string,
): EloHistoryPoint[] => {
  const data = getLeague(state, leagueId);
  if (!data) return [];
  // matches stored newest-first → reverse for chronological history
  const ordered = [...data.matches].reverse();
  const points: EloHistoryPoint[] = [];
  for (const m of ordered) {
    const change = m.elo_changes.find((c) => c.player_id === playerId);
    if (!change) continue;
    points.push({
      match_id: m.match_id,
      elo: change.elo_after,
      delta: change.delta,
      timestamp: m.created_at,
    });
  }
  return points;
};

export const selectDemoAchievements = (
  state: DemoStateLike,
  playerId: string,
  leagueId: string,
): Achievement[] => {
  const data = getLeague(state, leagueId);
  const player = data?.players.find((p) => p.player_id === playerId);
  const hasPlayed = (player?.matches_played ?? 0) > 0;
  const hitClimber = (player?.current_elo ?? 0) >= 1300;
  const now = new Date().toISOString();

  return [
    {
      type: "first_match",
      name: "First Match",
      description: "Play your first match",
      icon: "🎯",
      rarity: "common",
      unlocked: hasPlayed,
      unlocked_at: hasPlayed ? now : null,
    },
    {
      type: "win_streak_3",
      name: "Hat Trick",
      description: "Win 3 matches in a row",
      icon: "🔥",
      rarity: "common",
      unlocked: (player?.wins ?? 0) >= 3,
      unlocked_at: (player?.wins ?? 0) >= 3 ? now : null,
    },
    {
      type: "elo_1300",
      name: "Climber",
      description: "Reach an ELO of 1300",
      icon: "📈",
      rarity: "rare",
      unlocked: hitClimber,
      unlocked_at: hitClimber ? now : null,
    },
    {
      type: "comeback",
      name: "Comeback Kid",
      description: "Win after being down 5+ points",
      icon: "🚀",
      rarity: "epic",
      unlocked: false,
      unlocked_at: null,
    },
  ];
};

export const selectDemoInsights = (
  state: DemoStateLike,
  playerId: string,
  leagueId: string,
): PlayerInsights | null => {
  const data = getLeague(state, leagueId);
  if (!data) return null;
  const player = data.players.find((p) => p.player_id === playerId);
  if (!player) return null;

  const playerMatches = data.matches.filter(
    (m) =>
      m.team1_player_ids.includes(playerId) ||
      m.team2_player_ids.includes(playerId),
  );

  // streak (current + longest win)
  let current = 0;
  let longestWin = 0;
  let runWin = 0;
  // playerMatches is newest-first; iterate from newest for current streak
  for (const m of playerMatches) {
    const inTeam1 = m.team1_player_ids.includes(playerId);
    const won = inTeam1 ? m.team1_score > m.team2_score : m.team2_score > m.team1_score;
    if (current === 0) current = won ? 1 : -1;
    else if ((current > 0 && won) || (current < 0 && !won))
      current = current > 0 ? current + 1 : current - 1;
    else break;
  }
  // longest win iterated chronologically
  for (const m of [...playerMatches].reverse()) {
    const inTeam1 = m.team1_player_ids.includes(playerId);
    const won = inTeam1 ? m.team1_score > m.team2_score : m.team2_score > m.team1_score;
    if (won) {
      runWin += 1;
      if (runWin > longestWin) longestWin = runWin;
    } else {
      runWin = 0;
    }
  }

  // best win / worst loss (largest abs delta)
  let bestWin: PlayerInsights["best_win"] = null;
  let worstLoss: PlayerInsights["worst_loss"] = null;
  for (const m of playerMatches) {
    const change = m.elo_changes.find((c) => c.player_id === playerId);
    if (!change) continue;
    const inTeam1 = m.team1_player_ids.includes(playerId);
    const opponentIds = inTeam1 ? m.team2_player_ids : m.team1_player_ids;
    const opponentNames = opponentIds.map(
      (oid) => data.players.find((p) => p.player_id === oid)?.display_name ?? oid,
    );
    const teamScore = inTeam1 ? m.team1_score : m.team2_score;
    const opponentScore = inTeam1 ? m.team2_score : m.team1_score;

    const entry = {
      match_id: m.match_id,
      delta: change.delta,
      opponent_ids: opponentIds,
      opponent_names: opponentNames,
      team_score: teamScore,
      opponent_score: opponentScore,
      created_at: m.created_at,
    };
    if (change.delta > 0 && (!bestWin || change.delta > bestWin.delta)) bestWin = entry;
    if (change.delta < 0 && (!worstLoss || change.delta < worstLoss.delta))
      worstLoss = entry;
  }

  // head-to-head
  const h2hMap = new Map<
    string,
    { wins: number; losses: number; games: number; elo_swing: number }
  >();
  for (const m of playerMatches) {
    const inTeam1 = m.team1_player_ids.includes(playerId);
    const won = inTeam1 ? m.team1_score > m.team2_score : m.team2_score > m.team1_score;
    const opponents = inTeam1 ? m.team2_player_ids : m.team1_player_ids;
    const change = m.elo_changes.find((c) => c.player_id === playerId);
    for (const oid of opponents) {
      const cur = h2hMap.get(oid) ?? { wins: 0, losses: 0, games: 0, elo_swing: 0 };
      cur.games += 1;
      if (won) cur.wins += 1;
      else cur.losses += 1;
      cur.elo_swing += change?.delta ?? 0;
      h2hMap.set(oid, cur);
    }
  }
  const headToHead = [...h2hMap.entries()].map(([oid, v]) => ({
    opponent_id: oid,
    opponent_name: data.players.find((p) => p.player_id === oid)?.display_name ?? oid,
    ...v,
  }));

  // dream partners (2v2 only)
  const dreamPartners: PlayerInsights["dream_partners"] = [];
  if (data.league.league_type === "2v2") {
    const partnerMap = new Map<
      string,
      { wins: number; losses: number; games: number }
    >();
    for (const m of playerMatches) {
      const inTeam1 = m.team1_player_ids.includes(playerId);
      const team = inTeam1 ? m.team1_player_ids : m.team2_player_ids;
      const won = inTeam1
        ? m.team1_score > m.team2_score
        : m.team2_score > m.team1_score;
      for (const pid of team) {
        if (pid === playerId) continue;
        const cur = partnerMap.get(pid) ?? { wins: 0, losses: 0, games: 0 };
        cur.games += 1;
        if (won) cur.wins += 1;
        else cur.losses += 1;
        partnerMap.set(pid, cur);
      }
    }
    for (const [pid, v] of partnerMap.entries()) {
      dreamPartners.push({
        partner_id: pid,
        partner_name: data.players.find((p) => p.player_id === pid)?.display_name ?? pid,
        wins: v.wins,
        losses: v.losses,
        games: v.games,
        win_rate: v.games > 0 ? v.wins / v.games : 0,
      });
    }
    dreamPartners.sort((a, b) => b.win_rate - a.win_rate);
  }

  return {
    player_id: playerId,
    league_id: leagueId,
    league_type: data.league.league_type,
    streak: { current, longest_win: longestWin },
    best_win: bestWin,
    worst_loss: worstLoss,
    head_to_head: headToHead,
    dream_partners: dreamPartners,
  };
};
