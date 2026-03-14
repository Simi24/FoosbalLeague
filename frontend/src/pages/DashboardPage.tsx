import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MdAdd, MdPeople, MdSportsSoccer, MdSearch } from "react-icons/md";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { apiFetch } from "@/api";
import { initAuth } from "@/features/auth";
import { CreateLeagueForm } from "@/projects/league/components";
import type { League, MyLeague } from "@/projects/league/types";

export const DashboardPage = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [myLeagues, setMyLeagues] = useState<MyLeague[]>([]);
  const [allLeagues, setAllLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Registration state
  const [displayName, setDisplayName] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const needsRegistration = user && !user.player_id;

  const fetchData = async () => {
    if (needsRegistration) {
      setLoading(false);
      return;
    }
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
  }, [needsRegistration]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    setRegistering(true);

    const response = await apiFetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: displayName }),
    });

    if (response.ok) {
      await dispatch(initAuth());
    } else {
      const data = await response.json();
      setRegisterError(data.detail ?? "Registration failed");
    }
    setRegistering(false);
  };

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

  // Registration prompt for unregistered users
  if (needsRegistration) {
    return (
      <div className="mx-auto max-w-md py-12">
        <div className="rounded-xl border border-border bg-bg-secondary p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-light">
            <MdSportsSoccer size={32} className="text-accent" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-text-primary">Welcome to FoosLeague!</h1>
          <p className="mb-6 text-sm text-text-secondary">
            Choose a display name to complete your profile and start playing.
          </p>

          {registerError && (
            <div className="mb-4 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
              {registerError}
            </div>
          )}

          <form onSubmit={handleRegister}>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              className="mb-4 w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              required
              minLength={2}
              maxLength={50}
            />
            <button
              type="submit"
              disabled={registering}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {registering ? "Setting up..." : "Get Started"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">
          Welcome back{user?.name ? `, ${user.name}` : ""}
        </h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <MdAdd size={16} />
          Create League
        </button>
      </div>

      {showCreate && <CreateLeagueForm onCreated={handleCreated} />}

      {/* Onboarding card when user has no leagues */}
      {myLeagues.length === 0 && (
        <div className="mb-8 rounded-xl border border-accent/30 bg-accent-light/50 p-6">
          <h2 className="mb-2 text-lg font-semibold text-text-primary">Get started with FoosLeague</h2>
          <p className="mb-4 text-sm text-text-secondary">Join an existing league or create your own to start tracking matches.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              to="/leagues"
              className="flex items-center gap-3 rounded-xl border border-border bg-bg-secondary p-4 transition-colors hover:border-accent"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-light">
                <MdSearch size={20} className="text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Browse & Join a League</p>
                <p className="text-xs text-text-secondary">Find leagues to compete in</p>
              </div>
            </Link>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-3 rounded-xl border border-border bg-bg-secondary p-4 text-left transition-colors hover:border-accent"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-light">
                <MdAdd size={20} className="text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Create Your Own</p>
                <p className="text-xs text-text-secondary">Start a new league</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* My Leagues */}
      {myLeagues.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">My Leagues</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myLeagues.map((league) => (
              <Link
                key={league.league_id}
                to={`/leagues/${league.league_id}`}
                className="rounded-xl border border-border bg-bg-secondary p-5 shadow-sm transition-all hover:border-accent hover:shadow-md"
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
                <div className="mt-3 text-sm text-text-secondary">
                  ELO: <span className="font-mono font-semibold text-accent">{league.current_elo}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Available Leagues */}
      {availableLeagues.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Available Leagues</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableLeagues.map((league) => (
              <div
                key={league.league_id}
                className="rounded-xl border border-border bg-bg-secondary p-5 shadow-sm"
              >
                <h3 className="mb-2 text-lg font-semibold text-text-primary">{league.name}</h3>
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
                <button
                  onClick={() => handleJoin(league.league_id)}
                  className="mt-3 rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
