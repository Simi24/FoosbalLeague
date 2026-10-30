import { useState } from "react";
import { MdAdd, MdNotifications, MdSportsSoccer, MdVpnKey } from "react-icons/md";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  useGetMyLeaguesQuery,
  useRegisterPlayerMutation,
  useJoinLeagueMutation,
} from "@/api/baseApi";
import { initAuth } from "@/features/auth";
import {
  CreateLeagueForm,
  LeagueOverviewCard,
  PendingLeagueGroup,
} from "@/projects/league/components";

const TINTS = [
  "bg-team-blue-tint",
  "bg-team-red-tint",
  "bg-mint",
  "bg-butter",
  "bg-lavender",
  "bg-peach",
];

export const DashboardPage = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { data: myLeagues = [], isLoading: loading } = useGetMyLeaguesQuery();

  const [showCreate, setShowCreate] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [showJoin, setShowJoin] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerPlayer, { isLoading: registering }] = useRegisterPlayerMutation();
  const [joinLeague] = useJoinLeagueMutation();

  const needsRegistration = user && !user.player_id;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    try {
      await registerPlayer({ display_name: displayName }).unwrap();
      await dispatch(initAuth());
    } catch (err) {
      const detail = (err as { data?: { detail?: string } } | undefined)?.data?.detail;
      setRegisterError(detail ?? "Registration failed");
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError("");
    try {
      await joinLeague({ code: joinCode }).unwrap();
      setJoinCode("");
      setShowJoin(false);
    } catch (err) {
      const detail = (err as { data?: { detail?: string } } | undefined)?.data?.detail;
      setJoinError(detail ?? "Invalid code");
    }
  };

  if (needsRegistration) {
    return (
      <div className="mx-auto max-w-md py-12">
        <div className="animate-in brut-border brut-shadow-lg bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border-2 border-ink bg-butter">
            <MdSportsSoccer size={32} className="text-ink" />
          </div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-ink">
            Welcome to FoosRank!
          </h1>
          <p className="mb-6 text-sm font-medium text-ink-soft">
            Choose a display name to complete your profile and start playing.
          </p>

          {registerError && (
            <div className="brut-border mb-4 bg-coral px-3 py-2 text-sm font-semibold text-ink">
              {registerError}
            </div>
          )}

          <form onSubmit={handleRegister}>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              className="brut-border mb-4 min-h-[44px] w-full bg-card px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-muted"
              required
              minLength={2}
              maxLength={50}
            />
            <button
              type="submit"
              disabled={registering}
              className="brut-border btn-press brut-shadow min-h-[48px] w-full bg-ink px-4 py-2 text-sm font-bold uppercase tracking-wide text-paper transition-colors disabled:bg-ink-muted"
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
        <div className="h-8 w-8 animate-spin border-[3px] border-ink border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-ink-soft">
            Hi{user?.name ? `, ${user.name}` : ""}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
            Your hub
          </h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => {
              setShowJoin(!showJoin);
              setShowCreate(false);
            }}
            className="brut-border btn-press flex min-h-[44px] w-full items-center justify-center gap-2 bg-card px-4 py-2 text-sm font-bold uppercase tracking-wide text-ink transition-colors hover:bg-paper-alt sm:w-auto"
          >
            <MdVpnKey size={16} />
            Join
          </button>
          <button
            onClick={() => {
              setShowCreate(!showCreate);
              setShowJoin(false);
            }}
            className="brut-border btn-press brut-shadow flex min-h-[44px] w-full items-center justify-center gap-2 bg-ink px-4 py-2 text-sm font-bold uppercase tracking-wide text-paper transition-colors sm:w-auto"
          >
            <MdAdd size={16} />
            Create League
          </button>
        </div>
      </header>

      {showJoin && (
        <div className="brut-border brut-shadow bg-card p-5">
          <h2 className="mb-3 text-lg font-bold uppercase tracking-wide text-ink">
            Join with Invite Code
          </h2>
          <form
            onSubmit={handleJoinByCode}
            className="flex flex-col gap-2 sm:flex-row sm:gap-3"
          >
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="A1B2C3"
              className="brut-border min-h-[44px] flex-1 bg-card px-3 py-2 text-center font-mono text-base font-bold uppercase tracking-[0.3em] text-ink outline-none placeholder:text-ink-muted"
              required
              maxLength={10}
            />
            <button
              type="submit"
              className="brut-border btn-press brut-shadow min-h-[44px] bg-ink px-6 py-2 text-sm font-bold uppercase tracking-wide text-paper transition-colors"
            >
              Join
            </button>
          </form>
          {joinError && (
            <p className="mt-2 text-sm font-semibold text-danger">{joinError}</p>
          )}
        </div>
      )}

      {showCreate && <CreateLeagueForm onCreated={() => setShowCreate(false)} />}

      {myLeagues.length === 0 && !showCreate && !showJoin && (
        <div className="animate-in brut-border brut-shadow bg-butter p-6">
          <h2 className="mb-2 text-lg font-bold uppercase tracking-wide text-ink">
            Get started with FoosRank
          </h2>
          <p className="mb-4 text-sm font-medium text-ink-soft">
            Create a league and invite your colleagues, or join one with an invite code.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              onClick={() => setShowJoin(true)}
              className="card-interactive brut-border flex items-center gap-3 bg-card p-4 text-left"
            >
              <div className="flex h-10 w-10 items-center justify-center border-2 border-ink bg-lavender">
                <MdVpnKey size={20} className="text-ink" />
              </div>
              <div>
                <p className="text-sm font-bold text-ink">Join with Code</p>
                <p className="text-xs font-medium text-ink-soft">Enter an invite code</p>
              </div>
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="card-interactive brut-border flex items-center gap-3 bg-card p-4 text-left"
            >
              <div className="flex h-10 w-10 items-center justify-center border-2 border-ink bg-mint">
                <MdAdd size={20} className="text-ink" />
              </div>
              <div>
                <p className="text-sm font-bold text-ink">Create Your Own</p>
                <p className="text-xs font-medium text-ink-soft">Start a new league</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {myLeagues.length > 0 && (
        <section aria-label="Pending actions">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center border-2 border-ink bg-coral text-ink">
              <MdNotifications size={16} />
            </span>
            <h2 className="text-lg font-bold uppercase tracking-wide text-ink">
              Needs your action
            </h2>
          </div>
          <div className="peer space-y-3 empty:hidden">
            {myLeagues.map((lg) => (
              <PendingLeagueGroup key={lg.league_id} league={lg} />
            ))}
          </div>
          <p className="brut-border hidden bg-mint p-4 text-center text-sm font-bold text-ink peer-empty:block">
            All caught up — nothing pending.
          </p>
        </section>
      )}

      {myLeagues.length > 0 && (
        <section aria-label="Your leagues">
          <h2 className="mb-3 text-lg font-bold uppercase tracking-wide text-ink">
            Your Leagues
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myLeagues.map((league, i) => (
              <LeagueOverviewCard
                key={league.league_id}
                league={league}
                tint={TINTS[i % TINTS.length]!}
                animationDelay={i * 60}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
