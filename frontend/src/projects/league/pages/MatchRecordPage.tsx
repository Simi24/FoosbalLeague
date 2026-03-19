import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MdClose, MdSportsSoccer } from "react-icons/md";

import {
  useGetLeagueQuery,
  useGetLeagueMembersQuery,
  useGetLeaderboardQuery,
  useRecordMatchMutation,
} from "@/api/baseApi";
import { calculateEloPreview } from "@/shared/eloCalc";
import type { LeagueMember } from "../types";

type PlayerWithStats = LeagueMember & { matches_played: number };

export const MatchRecordPage = () => {
  const { id: leagueId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: league } = useGetLeagueQuery(leagueId!, { skip: !leagueId });
  const { data: members = [] } = useGetLeagueMembersQuery(leagueId!, { skip: !leagueId });
  const { data: leaderboard } = useGetLeaderboardQuery(leagueId!, { skip: !leagueId });
  const [recordMatch, { isLoading: submitting }] = useRecordMatchMutation();

  const players = useMemo<PlayerWithStats[]>(() => {
    const rankingMap = new Map(leaderboard?.entries.map((e) => [e.player_id, e]) ?? []);
    return members.map((m) => ({
      ...m,
      matches_played: rankingMap.get(m.player_id)?.matches_played ?? 0,
    }));
  }, [members, leaderboard]);

  const [team1Ids, setTeam1Ids] = useState<string[]>([]);
  const [team2Ids, setTeam2Ids] = useState<string[]>([]);
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");
  const [error, setError] = useState("");

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
    if (!teamsReady || !scoresReady) return new Map<string, number>();
    const s1 = Number(score1);
    const s2 = Number(score2);
    return calculateEloPreview(
      team1Players.map((p) => ({ id: p.player_id, elo: p.current_elo, matchesPlayed: p.matches_played })),
      team2Players.map((p) => ({ id: p.player_id, elo: p.current_elo, matchesPlayed: p.matches_played })),
      s1 > s2 ? true : s1 < s2 ? false : null,
    );
  }, [team1Players, team2Players, score1, score2, teamsReady, scoresReady]);

  const hasPreview = preview.size > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!teamsReady) {
      setError("Both teams need at least one player");
      return;
    }

    try {
      await recordMatch({
        league_id: leagueId!,
        team1: { player_ids: team1Ids, score: Number(score1) },
        team2: { player_ids: team2Ids, score: Number(score2) },
      }).unwrap();
      navigate(`/leagues/${leagueId}`);
    } catch (err: any) {
      setError(err?.data?.detail || "Failed to record match");
    }
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
    const teamColor = team === 1 ? "text-team-blue" : "text-team-red";
    const borderColor = team === 1 ? "border-team-blue/30" : "border-team-red/30";

    return (
      <div className="flex-1">
        <h3 className={`mb-2 text-sm font-semibold ${teamColor}`}>{label}</h3>
        <div className={`min-h-[100px] space-y-2 rounded-xl border-2 border-dashed ${borderColor} p-3`}>
          {teamPlayers.map((p) => (
            <PlayerChip
              key={p.player_id}
              player={p}
              onRemove={() => removeFromTeam(p.player_id)}
              delta={preview.get(p.player_id)}
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
                    className="flex-1 rounded-l-lg border border-border bg-bg-secondary px-3 py-3 text-sm text-text-primary transition-colors hover:border-team-blue/50 hover:bg-team-blue/10 sm:flex-initial sm:py-2"
                  >
                    <span className="font-medium">{p.display_name}</span>
                    <span className="ml-1.5 font-mono text-xs text-text-muted">{p.current_elo}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addToTeam(p.player_id, 2)}
                    className="rounded-r-lg border border-l-0 border-border bg-bg-secondary px-4 py-3 text-sm text-text-muted transition-colors hover:border-team-red/50 hover:bg-team-red/10 hover:text-team-red sm:px-2 sm:py-2 sm:text-xs"
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
            <label className="mb-1 block text-sm font-medium text-team-blue">
              Team 1 Score
            </label>
            <input
              type="number"
              min="0"
              value={score1}
              onChange={(e) => setScore1(e.target.value)}
              className="w-full rounded-lg border border-team-blue/30 bg-bg-tertiary px-3 py-3 text-center font-mono text-2xl text-team-blue outline-none focus:border-team-blue focus:ring-2 focus:ring-team-blue/20"
              required
            />
          </div>
          <span className="pb-3 text-lg font-bold text-text-muted">&ndash;</span>
          <div>
            <label className="mb-1 block text-sm font-medium text-team-red">
              Team 2 Score
            </label>
            <input
              type="number"
              min="0"
              value={score2}
              onChange={(e) => setScore2(e.target.value)}
              className="w-full rounded-lg border border-team-red/30 bg-bg-tertiary px-3 py-3 text-center font-mono text-2xl text-team-red outline-none focus:border-team-red focus:ring-2 focus:ring-team-red/20"
              required
            />
          </div>
        </div>

        {/* ELO Preview */}
        {hasPreview && (
          <div className="mb-6 rounded-xl border border-field-green/20 bg-field-green/5 p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-field-green">
              ELO Preview
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                {team1Players.map((p) => (
                  <div key={p.player_id} className="flex items-center justify-between text-sm">
                    <span className="text-text-primary">{p.display_name}</span>
                    <span
                      className={`font-mono font-semibold ${(preview.get(p.player_id) ?? 0) >= 0 ? "text-success" : "text-danger"}`}
                    >
                      {(preview.get(p.player_id) ?? 0) >= 0 ? "+" : ""}
                      {preview.get(p.player_id)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                {team2Players.map((p) => (
                  <div key={p.player_id} className="flex items-center justify-between text-sm">
                    <span className="text-text-primary">{p.display_name}</span>
                    <span
                      className={`font-mono font-semibold ${(preview.get(p.player_id) ?? 0) >= 0 ? "text-success" : "text-danger"}`}
                    >
                      {(preview.get(p.player_id) ?? 0) >= 0 ? "+" : ""}
                      {preview.get(p.player_id)}
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
