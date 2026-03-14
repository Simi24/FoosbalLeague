import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { apiFetch } from "@/api";
import { EloHistoryChart, StatCard } from "../components";
import type { EloHistoryPoint, MyLeague, Player } from "../types";

export const PlayerProfilePage = () => {
  const { id: playerId } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<Player | null>(null);
  const [eloHistory, setEloHistory] = useState<EloHistoryPoint[]>([]);
  const [leagues, setLeagues] = useState<MyLeague[]>([]);
  const [selectedLeague, setSelectedLeague] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) return;
    Promise.all([
      apiFetch(`/players/${playerId}`).then((r) => r.json()),
      apiFetch("/leagues/my").then((r) => (r.ok ? r.json() : [])) as Promise<MyLeague[]>,
    ])
      .then(([p, lg]) => {
        setPlayer(p);
        setLeagues(lg);
        if (lg.length > 0 && !selectedLeague) {
          setSelectedLeague(lg[0]!.league_id);
        }
      })
      .finally(() => setLoading(false));
  }, [playerId]);

  useEffect(() => {
    if (!playerId || !selectedLeague) return;
    apiFetch(`/rankings/player/${playerId}/history?league_id=${selectedLeague}`)
      .then((r) => (r.ok ? r.json() : { history: [] }))
      .then((data: { history: EloHistoryPoint[] }) => setEloHistory(data.history));
  }, [playerId, selectedLeague]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }
  if (!player) return <p className="text-danger">Player not found</p>;

  const winRate =
    player.total_matches > 0
      ? ((player.total_wins / player.total_matches) * 100).toFixed(0)
      : "0";

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-text-primary">
        {player.display_name}
      </h1>
      <p className="mb-6 text-sm text-text-secondary">{player.email}</p>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Matches" value={player.total_matches} />
        <StatCard label="Wins" value={player.total_wins} color="text-success" />
        <StatCard label="Losses" value={player.total_losses} color="text-danger" />
        <StatCard label="Win Rate" value={`${winRate}%`} color="text-accent" />
      </div>

      {leagues.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-secondary p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">
              ELO History
            </h2>
            <select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              {leagues.map((lg) => (
                <option key={lg.league_id} value={lg.league_id}>
                  {lg.name}
                </option>
              ))}
            </select>
          </div>
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
