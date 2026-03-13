import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MdAdd, MdPeople, MdSportsSoccer } from "react-icons/md";

import { useAppSelector } from "@/app/hooks";
import { apiFetch } from "@/api";
import { CreateLeagueForm } from "@/projects/league/components";
import type { League, MyLeague } from "@/projects/league/types";

export const DashboardPage = () => {
  const user = useAppSelector((state) => state.auth.user);

  const [myLeagues, setMyLeagues] = useState<MyLeague[]>([]);
  const [allLeagues, setAllLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [myRes, allRes] = await Promise.all([
      apiFetch("/leagues/my"),
      apiFetch("/leagues/"),
    ]);
    const my = myRes.ok ? ((await myRes.json()) as MyLeague[]) : [];
    const all = allRes.ok ? ((await allRes.json()) as League[]) : [];
    setMyLeagues(my);
    setAllLeagues(all);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const myLeagueIds = new Set(myLeagues.map((l) => l.league_id));
  const availableLeagues = allLeagues.filter((l) => !myLeagueIds.has(l.league_id));

  const handleJoin = async (leagueId: string) => {
    const response = await apiFetch(`/leagues/${leagueId}/join`, { method: "POST" });
    if (response.ok) {
      await fetchData();
    }
  };

  const handleCreated = async () => {
    setShowCreate(false);
    await fetchData();
  };

  if (loading) {
    return <p className="text-text-muted">Loading...</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">
          Welcome back{user?.name ? `, ${user.name}` : ""}
        </h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 rounded border border-neon-green px-4 py-2 text-sm text-neon-green transition-all hover:bg-neon-green hover:text-bg-primary"
        >
          <MdAdd size={16} />
          Create League
        </button>
      </div>

      {showCreate && <CreateLeagueForm onCreated={handleCreated} />}

      {/* My Leagues */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">My Leagues</h2>
        {myLeagues.length === 0 ? (
          <p className="text-sm text-text-muted">You haven't joined any leagues yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myLeagues.map((league) => (
              <Link
                key={league.league_id}
                to={`/leagues/${league.league_id}`}
                className="rounded border border-border bg-bg-secondary p-5 transition-all hover:border-neon-green"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-text-primary">{league.name}</h3>
                  <span className="rounded bg-bg-tertiary px-2 py-0.5 text-xs text-neon-green">
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
                  <span className="rounded bg-bg-tertiary px-2 py-0.5 text-xs text-neon-green">
                    {league.league_type}
                  </span>
                </div>
                <div className="mt-3 text-sm text-text-secondary">
                  ELO: <span className="font-semibold text-neon-green">{league.current_elo}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Available Leagues */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Available Leagues</h2>
        {availableLeagues.length === 0 ? (
          <p className="text-sm text-text-muted">No other leagues available.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableLeagues.map((league) => (
              <div
                key={league.league_id}
                className="rounded border border-border bg-bg-secondary p-5"
              >
                <h3 className="mb-2 text-lg font-semibold text-text-primary">{league.name}</h3>
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
                  <p className="mt-2 text-sm text-text-muted">{league.description}</p>
                )}
                <button
                  onClick={() => handleJoin(league.league_id)}
                  className="mt-3 rounded border border-neon-green px-3 py-1.5 text-sm text-neon-green transition-all hover:bg-neon-green hover:text-bg-primary"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
