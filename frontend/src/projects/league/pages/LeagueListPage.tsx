import { useState } from "react";
import { Link } from "react-router-dom";
import { MdAdd, MdPeople, MdSportsSoccer } from "react-icons/md";

import { useGetMyLeaguesQuery } from "@/api/baseApi";
import { CreateLeagueForm, EmptyState } from "../components";

export const LeagueListPage = () => {
  const { data: leagues = [], isLoading: loading } = useGetMyLeaguesQuery();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-text-primary">My Leagues</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover sm:w-auto"
        >
          <MdAdd size={16} />
          Create League
        </button>
      </div>

      {showCreate && <CreateLeagueForm onCreated={() => setShowCreate(false)} />}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : leagues.length === 0 ? (
        <EmptyState
          icon={<MdSportsSoccer size={40} />}
          title="No leagues yet"
          description="Create a league and share the invite code with your colleagues!"
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
          {leagues.map((league, i) => (
            <Link
              key={league.league_id}
              to={`/leagues/${league.league_id}`}
              className="card-interactive animate-in rounded-xl border border-border bg-bg-secondary p-5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">{league.name}</h3>
                <span className="rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-medium text-accent">
                  {league.role}
                </span>
              </div>
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
                <p className="mt-2 text-sm text-text-muted">{league.description}</p>
              )}
              <div className="mt-3 text-sm text-text-secondary">
                ELO: <span className="font-mono font-semibold text-accent">{league.current_elo}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
