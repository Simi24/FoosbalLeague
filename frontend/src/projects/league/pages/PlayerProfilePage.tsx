import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { apiFetch } from "@/api";
import { AchievementBadge, EloHistoryChart, StatCard } from "../components";
import type { Achievement, EloHistoryPoint, Leaderboard, MyLeague, Player, RankingEntry } from "../types";

export const PlayerProfilePage = () => {
  const { id: playerId } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<Player | null>(null);
  const [leagues, setLeagues] = useState<MyLeague[]>([]);
  const [selectedLeague, setSelectedLeague] = useState("");
  const [rankingEntry, setRankingEntry] = useState<RankingEntry | null>(null);
  const [eloHistory, setEloHistory] = useState<EloHistoryPoint[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) return;
    Promise.all([
      apiFetch(`/players/${playerId}`).then((r) => r.json()),
      apiFetch("/leagues/my").then((r) => (r.ok ? r.json() : [])) as Promise<MyLeague[]>,
    ])
      .then(([p, myLeagues]) => {
        setPlayer(p);
        setLeagues(myLeagues);
        if (myLeagues.length > 0 && !selectedLeague) {
          setSelectedLeague(myLeagues[0]!.league_id);
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
  if (!player) return <p className="text-danger">Player not found</p>;

  const winRate = rankingEntry && rankingEntry.matches_played > 0
    ? (rankingEntry.win_rate * 100).toFixed(0)
    : "0";

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {player.display_name}
          </h1>
          <p className="text-sm text-text-secondary">{player.email}</p>
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
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatCard label="ELO" value={rankingEntry.elo} color="text-accent" />
          <StatCard label="Rank" value={`#${rankingEntry.rank}`} />
          <StatCard label="Wins" value={rankingEntry.wins} color="text-success" />
          <StatCard label="Losses" value={rankingEntry.losses} color="text-danger" />
          <StatCard label="Win Rate" value={`${winRate}%`} color="text-accent" />
        </div>
      ) : leagues.length > 0 ? (
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
      {leagues.length > 0 && (
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
