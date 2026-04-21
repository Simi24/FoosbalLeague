import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useGetMyLeaguesQuery, useGetLeaderboardQuery } from "@/api/baseApi";
import { Avatar } from "@/components/Avatar";
import { EloInfoSheet } from "@/components/EloInfoSheet";
import { Dropdown } from "@/components/inputs";
import { Podium } from "../components";

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

  const rest = (leaderboard?.entries ?? []).filter((e) => e.rank > 3);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
            Leaderboard
          </h1>
          <EloInfoSheet />
        </div>
        <Dropdown
          value={selectedLeague}
          onChange={setSelectedLeague}
          options={myLeagues.map((lg) => ({ value: lg.league_id, label: lg.name }))}
          className="w-full sm:w-56"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin border-[3px] border-ink border-t-transparent" />
        </div>
      ) : !leaderboard || leaderboard.entries.length === 0 ? (
        <p className="text-sm font-medium text-ink-muted">No rankings yet.</p>
      ) : (
        <>
          <Podium entries={leaderboard.entries} />

          {rest.length > 0 && (
            <div className="brut-border brut-shadow bg-card">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-ink bg-paper-alt text-left text-xs font-bold uppercase tracking-wider text-ink">
                    <th className="w-12 px-3 py-3">#</th>
                    <th className="px-3 py-3">Player</th>
                    <th className="px-3 py-3 text-right">ELO</th>
                    <th className="hidden px-3 py-3 text-right sm:table-cell">W</th>
                    <th className="hidden px-3 py-3 text-right sm:table-cell">L</th>
                    <th className="hidden px-3 py-3 text-right sm:table-cell">Win %</th>
                  </tr>
                </thead>
                <tbody>
                  {rest.map((entry, i) => (
                    <tr
                      key={entry.player_id}
                      className={`animate-in border-b-2 border-ink/10 last:border-b-0 transition-colors ${
                        i % 2 === 1 ? "bg-paper-alt" : "bg-card"
                      }`}
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <td className="px-3 py-3 font-mono text-base font-bold text-ink">
                        {entry.rank}
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          to={`/players/${entry.player_id}`}
                          className="flex items-center gap-2 text-sm font-bold text-ink hover:underline"
                        >
                          <Avatar name={entry.display_name} size="sm" />
                          <span className="truncate">{entry.display_name}</span>
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm font-bold text-team-blue">
                        {entry.elo}
                      </td>
                      <td className="hidden px-3 py-3 text-right font-mono text-sm font-bold text-success sm:table-cell">
                        {entry.wins}
                      </td>
                      <td className="hidden px-3 py-3 text-right font-mono text-sm font-bold text-danger sm:table-cell">
                        {entry.losses}
                      </td>
                      <td className="hidden px-3 py-3 text-right font-mono text-sm font-semibold text-ink-soft sm:table-cell">
                        {(entry.win_rate * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};
