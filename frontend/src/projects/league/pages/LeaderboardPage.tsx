import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { apiFetch } from "@/api";
import type { Leaderboard, League, MyLeague } from "../types";

const getRankStyle = (rank: number): string => {
  if (rank === 1) return "bg-amber-50 border-amber-200";
  if (rank === 2) return "bg-gray-50 border-gray-200";
  if (rank === 3) return "bg-orange-50 border-orange-200";
  return "";
};

const getRankBadge = (rank: number): string | null => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
};

export const LeaderboardPage = () => {
  const { id: leagueId } = useParams<{ id: string }>();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState(leagueId ?? "");
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch("/leagues/").then((r) => r.json()) as Promise<League[]>,
      apiFetch("/leagues/my").then((r) => (r.ok ? r.json() : [])) as Promise<MyLeague[]>,
    ]).then(([allLeagues, myLeagues]) => {
      setLeagues(allLeagues);
      if (!selectedLeague && allLeagues.length > 0) {
        const defaultLeague = myLeagues.length > 0
          ? myLeagues[0]!.league_id
          : allLeagues[0]!.league_id;
        setSelectedLeague(defaultLeague);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedLeague) return;
    setLoading(true);
    apiFetch(`/rankings/league/${selectedLeague}`)
      .then((r) => r.json())
      .then(setLeaderboard)
      .finally(() => setLoading(false));
  }, [selectedLeague]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Leaderboard</h1>
        <select
          value={selectedLeague}
          onChange={(e) => setSelectedLeague(e.target.value)}
          className="rounded-lg border border-border bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        >
          {leagues.map((lg) => (
            <option key={lg.league_id} value={lg.league_id}>
              {lg.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : !leaderboard || leaderboard.entries.length === 0 ? (
        <p className="text-text-muted">No rankings yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-bg-secondary shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-sm text-text-secondary">
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3 text-right">ELO</th>
                <th className="px-4 py-3 text-right">W</th>
                <th className="px-4 py-3 text-right">L</th>
                <th className="px-4 py-3 text-right">Win %</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.entries.map((entry) => {
                const badge = getRankBadge(entry.rank);
                return (
                  <tr
                    key={entry.player_id}
                    className={`border-b border-border/50 transition-colors hover:bg-bg-tertiary ${getRankStyle(entry.rank)}`}
                  >
                    <td className="px-4 py-3 text-sm text-text-muted">
                      {badge ?? entry.rank}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/players/${entry.player_id}`}
                        className="text-sm font-medium text-text-primary hover:text-accent"
                      >
                        {entry.display_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-accent">
                      {entry.elo}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-success">
                      {entry.wins}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-danger">
                      {entry.losses}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-text-secondary">
                      {(entry.win_rate * 100).toFixed(0)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
