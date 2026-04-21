import { useState } from "react";
import { Link } from "react-router-dom";
import { MdAdd, MdPeople, MdSportsSoccer } from "react-icons/md";

import { useGetMyLeaguesQuery } from "@/api/baseApi";
import { CreateLeagueForm, EmptyState } from "../components";

const TINTS = ["bg-team-blue-tint", "bg-team-red-tint", "bg-mint", "bg-butter", "bg-lavender", "bg-peach"];

export const LeagueListPage = () => {
  const { data: leagues = [], isLoading: loading } = useGetMyLeaguesQuery();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
          My Leagues
        </h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="brut-border btn-press brut-shadow flex min-h-[44px] w-full items-center justify-center gap-2 bg-ink px-4 py-2 text-sm font-bold uppercase tracking-wide text-paper transition-colors sm:w-auto"
        >
          <MdAdd size={18} />
          Create League
        </button>
      </div>

      {showCreate && <CreateLeagueForm onCreated={() => setShowCreate(false)} />}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin border-[3px] border-ink border-t-transparent" />
        </div>
      ) : leagues.length === 0 ? (
        <EmptyState
          icon={<MdSportsSoccer size={28} />}
          title="No leagues yet"
          description="Create a league and share the invite code with your colleagues!"
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="brut-border btn-press brut-shadow min-h-[44px] bg-ink px-4 py-2 text-sm font-bold uppercase tracking-wide text-paper"
            >
              Create League
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {leagues.map((league, i) => {
            const tint = TINTS[i % TINTS.length]!;
            return (
              <Link
                key={league.league_id}
                to={`/leagues/${league.league_id}`}
                className="card-interactive animate-in brut-border brut-shadow block bg-card"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={`border-b-2 border-ink px-4 py-2 ${tint}`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink">
                    {league.role} · {league.league_type}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="mb-2 text-lg font-bold tracking-tight text-ink">
                    {league.name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm font-medium text-ink-soft">
                    <span className="flex items-center gap-1">
                      <MdPeople size={14} /> {league.member_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MdSportsSoccer size={14} /> {league.match_count}
                    </span>
                  </div>
                  {league.description && (
                    <p className="mt-2 text-sm text-ink-muted">{league.description}</p>
                  )}
                  <div className="mt-3 text-sm font-medium text-ink">
                    ELO:{" "}
                    <span className="font-mono font-bold text-team-blue">
                      {league.current_elo}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
