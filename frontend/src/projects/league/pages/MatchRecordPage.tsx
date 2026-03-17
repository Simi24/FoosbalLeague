import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MdClose, MdSportsSoccer } from "react-icons/md";

import { apiFetch } from "@/api";
import type { League, LeagueMember, RankingEntry } from "../types";

type PlayerWithStats = LeagueMember & { matches_played: number };

const getKFactor = (gamesPlayed: number): number => {
  if (gamesPlayed <= 10) return 40;
  if (gamesPlayed <= 30) return 32;
  return 24;
};

const expectedScore = (teamAvg: number, opponentAvg: number): number =>
  1.0 / (1.0 + Math.pow(10.0, (opponentAvg - teamAvg) / 400.0));

const calculatePreview = (
  team1: PlayerWithStats[],
  team2: PlayerWithStats[],
  team1Score: number,
  team2Score: number,
): Record<string, number> => {
  if (team1.length === 0 || team2.length === 0) return {};

  const team1Avg = team1.reduce((s, p) => s + p.current_elo, 0) / team1.length;
  const team2Avg = team2.reduce((s, p) => s + p.current_elo, 0) / team2.length;

  const team1Actual = team1Score > team2Score ? 1.0 : team1Score < team2Score ? 0.0 : 0.5;
  const team2Actual = 1.0 - team1Actual;

  const team1Expected = expectedScore(team1Avg, team2Avg);
  const team2Expected = expectedScore(team2Avg, team1Avg);

  const changes: Record<string, number> = {};
  for (const p of team1) {
    changes[p.player_id] = Math.round(getKFactor(p.matches_played) * (team1Actual - team1Expected));
  }
  for (const p of team2) {
    changes[p.player_id] = Math.round(getKFactor(p.matches_played) * (team2Actual - team2Expected));
  }
  return changes;
};

export const MatchRecordPage = () => {
  const { id: leagueId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [league, setLeague] = useState<League | null>(null);
  const [players, setPlayers] = useState<PlayerWithStats[]>([]);
  const [team1Ids, setTeam1Ids] = useState<string[]>([]);
  const [team2Ids, setTeam2Ids] = useState<string[]>([]);
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!leagueId) return;
    Promise.all([
      apiFetch(`/leagues/${leagueId}`).then((r) => r.json()) as Promise<League>,
      apiFetch(`/leagues/${leagueId}/members`).then((r) => r.json()) as Promise<LeagueMember[]>,
      apiFetch(`/rankings/league/${leagueId}`).then((r) =>
        r.ok ? r.json() : { entries: [] },
      ) as Promise<{ entries: RankingEntry[] }>,
    ]).then(([lg, mem, rankings]) => {
      setLeague(lg);
      const rankingMap = new Map(rankings.entries.map((e) => [e.player_id, e]));
      setPlayers(
        mem.map((m) => ({
          ...m,
          matches_played: rankingMap.get(m.player_id)?.matches_played ?? 0,
        })),
      );
    });
  }, [leagueId]);

  const maxPerTeam = league?.league_type === "1v1" ? 1 : 2;

  const unassigned = players.filter(
    (p) => !team1Ids.includes(p.player_id) && !team2Ids.includes(p.player_id),
  );
  const team1Players = players.filter((p) => team1Ids.includes(p.player_id));
  const team2Players = players.filter((p) => team2Ids.includes(p.player_id));

  const addToTeam = (playerId: string, team: 1 | 2) => {
    if (team === 1 && team1Ids.length < maxPerTeam) {
      setTeam2Ids((prev) => prev.filter((id) => id !== playerId));
      setTeam1Ids((prev) => [...prev.filter((id) => id !== playerId), playerId]);
    } else if (team === 2 && team2Ids.length < maxPerTeam) {
      setTeam1Ids((prev) => prev.filter((id) => id !== playerId));
      setTeam2Ids((prev) => [...prev.filter((id) => id !== playerId), playerId]);
    }
  };

  const removeFromTeam = (playerId: string) => {
    setTeam1Ids((prev) => prev.filter((id) => id !== playerId));
    setTeam2Ids((prev) => prev.filter((id) => id !== playerId));
  };

  const teamsReady = team1Ids.length > 0 && team2Ids.length > 0;
  const scoresReady = score1 !== "" && score2 !== "" && score1 !== score2;

  const preview = useMemo(() => {
    if (!teamsReady || !scoresReady) return {};
    return calculatePreview(team1Players, team2Players, Number(score1), Number(score2));
  }, [team1Players, team2Players, score1, score2, teamsReady, scoresReady]);

  const hasPreview = Object.keys(preview).length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!teamsReady) {
      setError("Both teams need at least one player");
      return;
    }

    setSubmitting(true);
    const response = await apiFetch("/matches/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        league_id: leagueId,
        team1: { player_ids: team1Ids, score: Number(score1) },
        team2: { player_ids: team2Ids, score: Number(score2) },
      }),
    });

    if (response.ok) {
      navigate(`/leagues/${leagueId}`);
    } else {
      const data = await response.json();
      setError(data.detail || "Failed to record match");
    }
    setSubmitting(false);
  };

  const PlayerChip = ({
    player,
    onRemove,
    delta,
  }: {
    player: PlayerWithStats;
    onRemove: () => void;
    delta?: number;
  }) => (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-tertiary px-3 py-2">
      <div className="flex-1">
        <span className="text-sm font-medium text-text-primary">{player.display_name}</span>
        <span className="ml-2 font-mono text-xs text-text-muted">{player.current_elo}</span>
        {delta !== undefined && (
          <span
            className={`ml-2 font-mono text-xs font-semibold ${delta >= 0 ? "text-success" : "text-danger"}`}
          >
            {delta >= 0 ? `+${delta}` : delta}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 text-text-muted transition-colors hover:bg-bg-secondary hover:text-danger"
      >
        <MdClose size={14} />
      </button>
    </div>
  );

  const TeamSlot = ({ team, label }: { team: 1 | 2; label: string }) => {
    const teamPlayers = team === 1 ? team1Players : team2Players;
    const slots = maxPerTeam - teamPlayers.length;

    return (
      <div className="flex-1">
        <h3 className="mb-2 text-sm font-semibold text-text-secondary">{label}</h3>
        <div className="min-h-[100px] space-y-2 rounded-xl border-2 border-dashed border-border p-3">
          {teamPlayers.map((p) => (
            <PlayerChip
              key={p.player_id}
              player={p}
              onRemove={() => removeFromTeam(p.player_id)}
              delta={preview[p.player_id]}
            />
          ))}
          {Array.from({ length: slots }).map((_, i) => (
            <div
              key={i}
              className="flex h-[42px] items-center justify-center rounded-lg border border-dashed border-border/50 text-xs text-text-muted"
            >
              Select a player
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-text-primary">Record Match</h1>

      <form onSubmit={handleSubmit}>
        {/* Unassigned players */}
        {unassigned.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-text-secondary">Players</h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {unassigned.map((p) => (
                <div key={p.player_id} className="flex w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => addToTeam(p.player_id, 1)}
                    className="flex-1 rounded-l-lg border border-border bg-bg-secondary px-3 py-3 text-sm text-text-primary transition-colors hover:border-accent hover:bg-accent-light sm:flex-initial sm:py-2"
                  >
                    <span className="font-medium">{p.display_name}</span>
                    <span className="ml-1.5 font-mono text-xs text-text-muted">{p.current_elo}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addToTeam(p.player_id, 2)}
                    className="rounded-r-lg border border-l-0 border-border bg-bg-secondary px-4 py-3 text-sm text-text-muted transition-colors hover:border-accent hover:bg-accent-light hover:text-accent sm:px-2 sm:py-2 sm:text-xs"
                  >
                    &rsaquo;
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-text-muted">
              Click to add to Team 1, or &rsaquo; for Team 2
            </p>
          </div>
        )}

        {/* Two-column teams */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <TeamSlot team={1} label="Team 1" />
          <div className="flex items-center justify-center sm:pt-6">
            <span className="text-lg font-bold text-text-muted">vs</span>
          </div>
          <TeamSlot team={2} label="Team 2" />
        </div>

        {/* Scores */}
        <div className="mb-6 grid grid-cols-[1fr_auto_1fr] items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Team 1 Score
            </label>
            <input
              type="number"
              min="0"
              value={score1}
              onChange={(e) => setScore1(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-3 text-center font-mono text-2xl text-accent outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              required
            />
          </div>
          <span className="pb-3 text-lg font-bold text-text-muted">&ndash;</span>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Team 2 Score
            </label>
            <input
              type="number"
              min="0"
              value={score2}
              onChange={(e) => setScore2(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-3 text-center font-mono text-2xl text-accent outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              required
            />
          </div>
        </div>

        {/* ELO Preview */}
        {hasPreview && (
          <div className="mb-6 rounded-xl border border-accent/30 bg-accent-light/30 p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">
              ELO Preview
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                {team1Players.map((p) => (
                  <div key={p.player_id} className="flex items-center justify-between text-sm">
                    <span className="text-text-primary">{p.display_name}</span>
                    <span
                      className={`font-mono font-semibold ${(preview[p.player_id] ?? 0) >= 0 ? "text-success" : "text-danger"}`}
                    >
                      {(preview[p.player_id] ?? 0) >= 0 ? "+" : ""}
                      {preview[p.player_id]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                {team2Players.map((p) => (
                  <div key={p.player_id} className="flex items-center justify-between text-sm">
                    <span className="text-text-primary">{p.display_name}</span>
                    <span
                      className={`font-mono font-semibold ${(preview[p.player_id] ?? 0) >= 0 ? "text-success" : "text-danger"}`}
                    >
                      {(preview[p.player_id] ?? 0) >= 0 ? "+" : ""}
                      {preview[p.player_id]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && <p className="mb-4 text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !teamsReady}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          <MdSportsSoccer size={18} />
          {submitting ? "Recording..." : "Record Match"}
        </button>
      </form>
    </div>
  );
};
