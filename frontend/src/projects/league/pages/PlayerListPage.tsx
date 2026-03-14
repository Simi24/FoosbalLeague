import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MdChevronRight, MdPeople } from "react-icons/md";

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
          {players.map((p) => (
            <Link
              key={p.player_id}
              to={`/players/${p.player_id}`}
              className="flex items-center justify-between border-b border-border/50 px-4 py-3 transition-colors hover:bg-bg-tertiary last:border-b-0"
            >
              <div>
                <p className="text-sm font-medium text-text-primary">{p.display_name}</p>
                <p className="text-xs text-text-muted">{p.email}</p>
              </div>
              <MdChevronRight size={20} className="text-text-muted" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
