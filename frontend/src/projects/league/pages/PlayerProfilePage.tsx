import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  api,
  useGetPlayerQuery,
  useGetMyLeaguesQuery,
  useGetLeaderboardQuery,
  useGetEloHistoryQuery,
  useGetAchievementsQuery,
} from "@/api/baseApi";
import { useAppDispatch } from "@/app/hooks";
import { Avatar } from "@/components/Avatar";
import { Dropdown } from "@/components/inputs";
import { AchievementBadge, EloHistoryChart, StatCard } from "../components";
import type { MyLeague } from "../types";

export const PlayerProfilePage = () => {
  const { id: playerId } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { data: player, isLoading: loading } = useGetPlayerQuery(playerId!, { skip: !playerId });
  const { data: myLeagues = [] } = useGetMyLeaguesQuery();

  const [sharedLeagues, setSharedLeagues] = useState<MyLeague[]>([]);
  const [selectedLeague, setSelectedLeague] = useState("");

  // Find shared leagues by checking each leaderboard
  useEffect(() => {
    if (!playerId || myLeagues.length === 0) return;

    Promise.all(
      myLeagues.map(async (lg) => {
        const result = dispatch(api.endpoints.getLeaderboard.initiate(lg.league_id));
        try {
          const data = await result.unwrap();
          const hasPlayer = data.entries.some((e) => e.player_id === playerId);
          return hasPlayer ? lg : null;
        } catch {
          return null;
        } finally {
          result.unsubscribe();
        }
      }),
    ).then((checks) => {
      const shared = checks.filter((lg): lg is MyLeague => lg !== null);
      setSharedLeagues(shared);
      if (shared.length > 0 && !selectedLeague) {
        setSelectedLeague(shared[0]!.league_id);
      }
    });
  }, [playerId, myLeagues]);

  const { data: leaderboard } = useGetLeaderboardQuery(selectedLeague, { skip: !selectedLeague });
  const { data: eloHistory = [] } = useGetEloHistoryQuery(
    { playerId: playerId!, leagueId: selectedLeague },
    { skip: !playerId || !selectedLeague },
  );
  const { data: achievements = [] } = useGetAchievementsQuery(
    { playerId: playerId!, leagueId: selectedLeague },
    { skip: !playerId || !selectedLeague },
  );

  const rankingEntry = leaderboard?.entries.find((e) => e.player_id === playerId) ?? null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }
  if (!player) return <p className="text-danger">Player not found</p>;

  const winRate = rankingEntry && rankingEntry.matches_played > 0
    ? (rankingEntry.win_rate * 100).toFixed(0)
    : "0";

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={player.display_name} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {player.display_name}
            </h1>
            <p className="text-sm text-text-secondary">{player.email}</p>
          </div>
        </div>
        {sharedLeagues.length > 0 && (
          <Dropdown
            value={selectedLeague}
            onChange={setSelectedLeague}
            options={sharedLeagues.map((lg) => ({ value: lg.league_id, label: lg.name }))}
            className="w-full sm:w-48"
          />
        )}
      </div>

      {rankingEntry ? (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-5">
          <StatCard label="ELO" value={rankingEntry.elo} color="text-accent" />
          <StatCard label="Rank" value={`#${rankingEntry.rank}`} />
          <StatCard label="Wins" value={rankingEntry.wins} color="text-success" />
          <StatCard label="Losses" value={rankingEntry.losses} color="text-danger" />
          <StatCard label="Win Rate" value={`${winRate}%`} color="text-accent" />
        </div>
      ) : sharedLeagues.length > 0 ? (
        <p className="mb-6 text-sm text-text-muted">No stats in this league yet.</p>
      ) : (
        <p className="mb-6 text-sm text-text-muted">Not enrolled in any league yet.</p>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-bg-secondary p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            Achievements
            {unlockedAchievements.length > 0 && (
              <span className="ml-2 text-sm font-normal text-text-muted">
                {unlockedAchievements.length}/{achievements.length}
              </span>
            )}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {unlockedAchievements.map((a) => (
              <AchievementBadge key={a.type} {...a} />
            ))}
            {lockedAchievements.map((a) => (
              <AchievementBadge key={a.type} {...a} />
            ))}
          </div>
        </div>
      )}

      {/* ELO History */}
      {sharedLeagues.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-secondary p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            ELO History
          </h2>
          {eloHistory.length > 0 ? (
            <EloHistoryChart data={eloHistory} />
          ) : (
            <p className="text-sm text-text-muted">No match history in this league yet.</p>
          )}
        </div>
      )}
    </div>
  );
};
