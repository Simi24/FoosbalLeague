import { useEffect, useState } from "react";

import { apiFetch } from "@/api";
import { useAppSelector } from "@/app/hooks";
import { Avatar } from "@/components/Avatar";
import { AchievementBadge, EloHistoryChart, StatCard } from "@/projects/league/components";
import type { Achievement, EloHistoryPoint, Leaderboard, MyLeague, RankingEntry } from "@/projects/league/types";

export const ProfilePage = () => {
  const user = useAppSelector((state) => state.auth.user);
  const [leagues, setLeagues] = useState<MyLeague[]>([]);
  const [selectedLeague, setSelectedLeague] = useState("");
  const [rankingEntry, setRankingEntry] = useState<RankingEntry | null>(null);
  const [eloHistory, setEloHistory] = useState<EloHistoryPoint[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const playerId = user?.player_id;

  useEffect(() => {
    if (!playerId) return;
    apiFetch("/leagues/my")
      .then((r) => (r.ok ? r.json() : []))
      .then((lg: MyLeague[]) => {
        setLeagues(lg);
        if (lg.length > 0 && !selectedLeague) {
          setSelectedLeague(lg[0]!.league_id);
        }
      })
      .finally(() => setLoading(false));
  }, [playerId]);

  useEffect(() => {
    if (!playerId || !selectedLeague) return;

    Promise.all([
      apiFetch(`/rankings/league/${selectedLeague}`)
        .then((r) => (r.ok ? r.json() : null)) as Promise<Leaderboard | null>,
      apiFetch(`/rankings/player/${playerId}/history?league_id=${selectedLeague}`)
        .then((r) => (r.ok ? r.json() : { history: [] })) as Promise<{ history: EloHistoryPoint[] }>,
      apiFetch(`/achievements/player/${playerId}?league_id=${selectedLeague}`)
        .then((r) => (r.ok ? r.json() : { achievements: [] })) as Promise<{ achievements: Achievement[] }>,
    ]).then(([leaderboard, historyData, achievementData]) => {
      const entry = leaderboard?.entries.find((e) => e.player_id === playerId) ?? null;
      setRankingEntry(entry);
      setEloHistory(historyData.history);
      setAchievements(achievementData.achievements);
    });
  }, [playerId, selectedLeague]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!user || !playerId) {
    return <p className="text-text-muted">Player profile not set up yet.</p>;
  }

  const winRate = rankingEntry && rankingEntry.matches_played > 0
    ? (rankingEntry.win_rate * 100).toFixed(0)
    : "0";

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{user.name}</h1>
            <p className="text-sm text-text-secondary">{user.email}</p>
          </div>
        </div>
        {leagues.length > 0 && (
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
      ) : leagues.length > 0 ? (
        <p className="mb-6 text-sm text-text-muted">No stats in this league yet.</p>
      ) : (
        <p className="mb-6 text-sm text-text-muted">Join a league to start tracking your stats.</p>
      )}

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

      {leagues.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-secondary p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">ELO History</h2>
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
