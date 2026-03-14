import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MdPeople } from "react-icons/md";

import { apiFetch } from "@/api";
import { EmptyState } from "../components";
import type { Player } from "../types";

export const PlayerListPage = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/players/")
      .then((r) => r.json())
      .then(setPlayers)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-text-primary">Players</h1>

      {players.length === 0 ? (
        <EmptyState
          icon={<MdPeople size={40} />}
          title="No players yet"
          description="Players appear here after they register."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-bg-secondary shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-sm text-text-secondary">
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3 text-right">Matches</th>
                <th className="px-4 py-3 text-right">Wins</th>
                <th className="px-4 py-3 text-right">Losses</th>
                <th className="px-4 py-3 text-right">Win %</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => {
                const winRate = p.total_matches > 0
                  ? ((p.total_wins / p.total_matches) * 100).toFixed(0)
                  : "0";
                return (
                  <tr
                    key={p.player_id}
                    className="border-b border-border/50 transition-colors hover:bg-bg-tertiary"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/players/${p.player_id}`}
                        className="text-sm font-medium text-text-primary hover:text-accent"
                      >
                        {p.display_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-text-secondary">
                      {p.total_matches}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-success">
                      {p.total_wins}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-danger">
                      {p.total_losses}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-text-secondary">
                      {winRate}%
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
