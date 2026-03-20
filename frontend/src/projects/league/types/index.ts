export type League = {
  league_id: string;
  name: string;
  league_type: "1v1" | "2v2";
  initial_elo: number;
  description: string;
  tenant_id: string;
  member_count: number;
  match_count: number;
};

export type LeagueMember = {
  player_id: string;
  display_name: string;
  role: "player" | "admin";
  current_elo: number;
};

export type Match = {
  match_id: string;
  league_id: string;
  team1_player_ids: string[];
  team2_player_ids: string[];
  team1_score: number;
  team2_score: number;
  status: "PENDING" | "CONFIRMED" | "DISPUTED";
  submitted_by: string;
  elo_changes: EloChange[];
  created_at: string;
};

export type EloChange = {
  player_id: string;
  display_name: string;
  elo_before: number;
  elo_after: number;
  delta: number;
};

export type RankingEntry = {
  rank: number;
  player_id: string;
  display_name: string;
  elo: number;
  matches_played: number;
  wins: number;
  losses: number;
  win_rate: number;
};

export type Leaderboard = {
  league_id: string;
  league_name: string;
  entries: RankingEntry[];
};

export type Player = {
  player_id: string;
  display_name: string;
  email?: string;
  tenant_id: string;
  total_matches: number;
  total_wins: number;
  total_losses: number;
};

export type EloHistoryPoint = {
  match_id: string;
  elo: number;
  delta: number;
  timestamp: string;
};

export type MyLeague = {
  league_id: string;
  name: string;
  league_type: "1v1" | "2v2";
  description: string;
  member_count: number;
  match_count: number;
  role: "player" | "admin";
  current_elo: number;
  invite_code: string | null;
};

export type Achievement = {
  type: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  unlocked: boolean;
  unlocked_at: string | null;
};
