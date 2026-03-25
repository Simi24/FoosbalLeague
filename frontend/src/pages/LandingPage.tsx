import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  MdEmojiEvents,
  MdGroups,
  MdLeaderboard,
  MdTimeline,
  MdSportsSoccer,
  MdVpnKey,
} from "react-icons/md";

import { useAppSelector } from "@/app/hooks";
import { EloExample } from "@/components/EloExample";

interface ChangelogEntry {
  version: string;
  date: string;
  summary: string[];
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const features = [
  {
    icon: MdLeaderboard,
    title: "ELO Rankings",
    description: "Fair skill-based ratings powered by the same system used in chess.",
    gradient: "from-blue-500/20 to-blue-600/5",
    iconColor: "text-blue-400",
  },
  {
    icon: MdGroups,
    title: "1v1 & 2v2",
    description: "Singles or doubles — team ratings adjust individually.",
    gradient: "from-purple-500/20 to-purple-600/5",
    iconColor: "text-purple-400",
  },
  {
    icon: MdEmojiEvents,
    title: "Achievements",
    description: "10 badges from common to legendary. First Blood, Giant Killer, Top Dog...",
    gradient: "from-amber-500/20 to-amber-600/5",
    iconColor: "text-amber-400",
  },
  {
    icon: MdVpnKey,
    title: "Private Leagues",
    description: "Create invite-only leagues for your office, friend group, or team.",
    gradient: "from-emerald-500/20 to-emerald-600/5",
    iconColor: "text-emerald-400",
  },
  {
    icon: MdTimeline,
    title: "ELO History",
    description: "Interactive charts tracking your rating over time.",
    gradient: "from-red-500/20 to-red-600/5",
    iconColor: "text-red-400",
  },
  {
    icon: MdSportsSoccer,
    title: "Match Confirmation",
    description: "Opponents confirm or dispute results — no cheating allowed.",
    gradient: "from-cyan-500/20 to-cyan-600/5",
    iconColor: "text-cyan-400",
  },
];

export const LandingPage = () => {
  const { isAuthenticated, status } = useAppSelector((state) => state.auth);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);

  useEffect(() => {
    fetch("/changelog.json")
      .then((res) => res.json())
      .then((data: ChangelogEntry[]) => setChangelog(data.slice(0, 3)))
      .catch(() => setChangelog([]));
  }, []);

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-20 pb-16 sm:pt-28 sm:pb-20">
        {/* Glow effect behind logo */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[600px] rounded-full bg-accent/5 blur-[120px]" />

        <div className="relative flex flex-col items-center text-center">
          <div
            className="animate-in mb-8 flex h-20 w-20 items-center justify-center rounded-3xl border border-border bg-gradient-to-br from-accent/20 to-transparent shadow-lg shadow-accent/10"
          >
            <MdSportsSoccer size={40} className="text-accent" />
          </div>

          <h1 className="animate-in brand-gradient mb-4 text-5xl font-bold tracking-tight sm:text-6xl">
            FoosLeague
          </h1>

          <p
            className="animate-in mb-3 text-xl text-text-secondary"
            style={{ animationDelay: "50ms" }}
          >
            ELO-based office foosball rankings
          </p>

          <p
            className="animate-in mb-10 max-w-lg text-sm leading-relaxed text-text-muted"
            style={{ animationDelay: "100ms" }}
          >
            Create leagues, record matches, track your rating, and earn achievements.
            Fair rankings powered by the same system used in chess.
          </p>

          <div
            className="animate-in flex flex-col gap-3 sm:flex-row"
            style={{ animationDelay: "150ms" }}
          >
            <Link
              to="/login"
              className="btn-press rounded-xl bg-accent px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent-hover hover:shadow-accent/40"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="btn-press rounded-xl border border-border bg-bg-secondary px-8 py-3 text-sm font-semibold text-text-primary transition-all hover:bg-bg-tertiary"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="animate-in mb-10 text-center text-2xl font-bold text-text-primary">
            Everything you need to run a league
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feat, i) => (
              <div
                key={feat.title}
                className="animate-in card-interactive rounded-xl border border-border bg-gradient-to-br p-5"
                style={{
                  animationDelay: `${i * 60}ms`,
                  backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
                }}
              >
                <div
                  className={`bg-gradient-to-br ${feat.gradient} mb-3 flex h-10 w-10 items-center justify-center rounded-lg`}
                >
                  <feat.icon size={22} className={feat.iconColor} />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-text-primary">
                  {feat.title}
                </h3>
                <p className="text-xs leading-relaxed text-text-secondary">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How ELO works — by example */}
      <section className="border-y border-border bg-bg-secondary px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-lg">
          <h2 className="mb-2 text-center text-2xl font-bold text-text-primary">
            How ELO Works
          </h2>
          <p className="mb-8 text-center text-sm text-text-muted">
            Everyone starts at 1200. Win and go up, lose and go down.
          </p>
          <EloExample />
        </div>
      </section>

      {/* What's New */}
      {changelog.length > 0 && (
        <section className="px-4 py-12 sm:py-16">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-8 text-center text-2xl font-bold text-text-primary">
              What&apos;s New
            </h2>
            <div className="space-y-4">
              {changelog.map((entry, i) => (
                <div
                  key={entry.version}
                  className="animate-in rounded-xl border border-border bg-bg-secondary p-4 shadow-sm"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="mb-2 flex items-center gap-3">
                    <span className="rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-semibold text-accent">
                      v{entry.version}
                    </span>
                    <span className="text-xs text-text-muted">{formatDate(entry.date)}</span>
                  </div>
                  <ul className="space-y-1">
                    {entry.summary.map((item, j) => (
                      <li key={j} className="flex gap-2 text-sm text-text-secondary">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/50" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link
                to="/changelog"
                className="text-sm text-text-secondary transition-colors hover:text-accent"
              >
                View all updates
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border px-4 py-6 text-center text-xs text-text-muted">
        <Link to="/changelog" className="transition-colors hover:text-text-secondary">
          FoosLeague v{__APP_VERSION__}
        </Link>
      </footer>
    </div>
  );
};
