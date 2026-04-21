import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MdChevronRight, MdPeople } from "react-icons/md";

import { apiFetch } from "@/api";
import { useAppSelector } from "@/app/hooks";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "../components";
import type { Player } from "../types";

export const PlayerListPage = () => {
  const currentPlayerId = useAppSelector((state) => state.auth.user?.player_id);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/players/")
      .then((r) => r.json())
      .then((all: Player[]) => setPlayers(all.filter((p) => p.player_id !== currentPlayerId)))
      .finally(() => setLoading(false));
  }, [currentPlayerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin border-[3px] border-ink border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-ink md:text-4xl">Players</h1>

      {players.length === 0 ? (
        <EmptyState
          icon={<MdPeople size={28} />}
          title="No players yet"
          description="Players appear here after they register."
        />
      ) : (
        <ul className="brut-border brut-shadow overflow-hidden bg-card">
          {players.map((p) => (
            <li key={p.player_id} className="border-b-2 border-ink last:border-b-0">
              <Link
                to={`/players/${p.player_id}`}
                className="flex min-h-[56px] items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-butter"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={p.display_name} size="md" />
                  <div>
                    <p className="text-sm font-bold text-ink">{p.display_name}</p>
                    <p className="font-mono text-xs text-ink-muted">
                      {p.total_matches} matches · {p.total_wins}W / {p.total_losses}L
                    </p>
                  </div>
                </div>
                <MdChevronRight size={22} className="text-ink" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
