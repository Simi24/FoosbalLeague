import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { apiFetch } from "@/api";
import type { Leaderboard, League } from "../types";

export const LeaderboardPage = () => {
  const { id: leagueId } = useParams<{ id: string }>();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState(leagueId ?? "");
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch("/leagues/")
      .then((r) => r.json())
      .then((data: League[]) => {
        setLeagues(data);
        if (!selectedLeague && data.length > 0 && data[0]) {
          setSelectedLeague(data[0].league_id);
        }
      });
  }, [selectedLeague]);

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
          className="rounded border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none focus:border-neon-green"
        >
          {leagues.map((lg) => (
            <option key={lg.league_id} value={lg.league_id}>
              {lg.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : !leaderboard || leaderboard.entries.length === 0 ? (
        <p className="text-text-muted">No rankings yet.</p>
      ) : (
        <div className="rounded border border-border bg-bg-secondary">
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
              {leaderboard.entries.map((entry) => (
                <tr
                  key={entry.player_id}
                  className="border-b border-border/50 transition-colors hover:bg-bg-tertiary"
                >
                  <td className="px-4 py-3 text-sm text-text-muted">
                    {entry.rank}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/players/${entry.player_id}`}
                      className="text-sm text-text-primary hover:text-neon-green"
                    >
                      {entry.display_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-neon-green">
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
