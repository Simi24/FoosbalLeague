import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { apiFetch } from "@/api";
import { EloHistoryChart } from "../components/EloHistoryChart";
import type { EloHistoryPoint, Player } from "../types";

export const PlayerProfilePage = () => {
  const { id: playerId } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<Player | null>(null);
  const [eloHistory] = useState<EloHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) return;
    apiFetch(`/players/${playerId}`)
      .then((r) => r.json())
      .then(setPlayer)
      .finally(() => setLoading(false));
  }, [playerId]);

  if (loading) return <p className="text-text-muted">Loading...</p>;
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
        <StatCard
          label="Losses"
          value={player.total_losses}
          color="text-danger"
        />
        <StatCard label="Win Rate" value={`${winRate}%`} color="text-neon-green" />
      </div>

      {eloHistory.length > 0 && (
        <div className="rounded border border-border bg-bg-secondary p-5">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            ELO History
          </h2>
          <EloHistoryChart data={eloHistory} />
        </div>
      )}
    </div>
  );
};

const StatCard = ({
  label,
  value,
  color = "text-text-primary",
}: {
  label: string;
  value: string | number;
  color?: string;
}) => (
  <div className="rounded border border-border bg-bg-secondary p-4">
    <p className="text-xs text-text-muted">{label}</p>
    <p className={`mt-1 font-mono text-2xl ${color}`}>{value}</p>
  </div>
);
