import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MdAdd, MdPeople, MdSportsSoccer } from "react-icons/md";

import { apiFetch } from "@/api";
import { CreateLeagueForm, EmptyState } from "../components";
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
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
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
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : leagues.length === 0 ? (
        <EmptyState
          icon={<MdSportsSoccer size={40} />}
          title="No leagues yet"
          description="Create the first league and invite your colleagues!"
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Create League
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {leagues.map((league) => (
            <Link
              key={league.league_id}
              to={`/leagues/${league.league_id}`}
              className="rounded-xl border border-border bg-bg-secondary p-5 shadow-sm transition-all hover:border-accent hover:shadow-md"
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
                <span className="rounded-full bg-bg-tertiary px-2.5 py-0.5 text-xs font-medium text-text-secondary">
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
