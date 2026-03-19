import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useGetMyLeaguesQuery, useGetLeaderboardQuery } from "@/api/baseApi";
import { Avatar } from "@/components/Avatar";
import { Dropdown } from "@/components/inputs";

const getRankStyle = (rank: number): string => {
  if (rank === 1) return "bg-amber-50 border-amber-200";
  if (rank === 2) return "bg-gray-50 border-gray-200";
  if (rank === 3) return "bg-orange-50 border-orange-200";
  return "";
};

const getRankBadge = (rank: number): string | null => {
  if (rank === 1) return "\u{1F947}";
  if (rank === 2) return "\u{1F948}";
  if (rank === 3) return "\u{1F949}";
  return null;
};

export const LeaderboardPage = () => {
  const { id: leagueId } = useParams<{ id: string }>();
  const { data: myLeagues = [] } = useGetMyLeaguesQuery();
  const [selectedLeague, setSelectedLeague] = useState(leagueId ?? "");

  useEffect(() => {
    if (!selectedLeague && myLeagues.length > 0) {
      setSelectedLeague(myLeagues[0]!.league_id);
    }
  }, [myLeagues, selectedLeague]);

  const { data: leaderboard, isLoading: loading } = useGetLeaderboardQuery(selectedLeague, {
    skip: !selectedLeague,
  });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Leaderboard</h1>
        <Dropdown
          value={selectedLeague}
          onChange={setSelectedLeague}
          options={myLeagues.map((lg) => ({ value: lg.league_id, label: lg.name }))}
          className="w-full sm:w-48"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : !leaderboard || leaderboard.entries.length === 0 ? (
        <p className="text-text-muted">No rankings yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-bg-secondary shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-sm text-text-secondary">
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3 text-right">ELO</th>
                <th className="hidden px-4 py-3 text-right sm:table-cell">W</th>
                <th className="hidden px-4 py-3 text-right sm:table-cell">L</th>
                <th className="hidden px-4 py-3 text-right sm:table-cell">Win %</th>
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
                        className="flex items-center gap-2 text-sm font-medium text-text-primary hover:text-accent"
                      >
                        <Avatar name={entry.display_name} size="sm" />
                        {entry.display_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-accent">
                      {entry.elo}
                    </td>
                    <td className="hidden px-4 py-3 text-right text-sm text-success sm:table-cell">
                      {entry.wins}
                    </td>
                    <td className="hidden px-4 py-3 text-right text-sm text-danger sm:table-cell">
                      {entry.losses}
                    </td>
                    <td className="hidden px-4 py-3 text-right text-sm text-text-secondary sm:table-cell">
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
