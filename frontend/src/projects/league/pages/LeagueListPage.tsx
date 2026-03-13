import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MdAdd, MdPeople, MdSportsSoccer } from "react-icons/md";

import { apiFetch } from "@/api";
import { CreateLeagueForm } from "../components";
import type { League } from "../types";

export const LeagueListPage = () => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    apiFetch("/leagues/")
      .then((r) => r.json())
      .then(setLeagues)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Leagues</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 rounded border border-neon-green px-4 py-2 text-sm text-neon-green transition-all hover:bg-neon-green hover:text-bg-primary"
        >
          <MdAdd size={16} />
          Create League
        </button>
      </div>

      {showCreate && <CreateLeagueForm onCreated={(lg) => {
        setLeagues((prev) => [...prev, lg]);
        setShowCreate(false);
      }} />}

      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : leagues.length === 0 ? (
        <p className="text-text-muted">No leagues yet. Create one!</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {leagues.map((league) => (
            <Link
              key={league.league_id}
              to={`/leagues/${league.league_id}`}
              className="rounded border border-border bg-bg-secondary p-5 transition-all hover:border-neon-green"
            >
              <h3 className="mb-2 text-lg font-semibold text-text-primary">
                {league.name}
              </h3>
              <div className="flex items-center gap-4 text-sm text-text-secondary">
                <span className="flex items-center gap-1">
                  <MdPeople size={14} /> {league.member_count}
                </span>
                <span className="flex items-center gap-1">
                  <MdSportsSoccer size={14} /> {league.match_count}
                </span>
                <span className="rounded bg-bg-tertiary px-2 py-0.5 text-xs text-neon-green">
                  {league.league_type}
                </span>
              </div>
              {league.description && (
                <p className="mt-2 text-sm text-text-muted">
                  {league.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
