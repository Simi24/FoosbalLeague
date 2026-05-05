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
import { BrandMark } from "@/components/layout";

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
    fill: "bg-team-blue-tint",
    rotate: "rotate-[-1deg]",
  },
  {
    icon: MdGroups,
    title: "1v1 & 2v2",
    description: "Singles or doubles — team ratings adjust individually.",
    fill: "bg-lavender",
    rotate: "rotate-[1deg]",
  },
  {
    icon: MdEmojiEvents,
    title: "Achievements",
    description: "10 badges from common to legendary. First Blood, Giant Killer, Top Dog...",
    fill: "bg-butter",
    rotate: "rotate-[-1deg]",
  },
  {
    icon: MdVpnKey,
    title: "Private Leagues",
    description: "Create invite-only leagues for your office, friend group, or team.",
    fill: "bg-mint",
    rotate: "rotate-[1deg]",
  },
  {
    icon: MdTimeline,
    title: "ELO History",
    description: "Interactive charts tracking your rating over time.",
    fill: "bg-team-red-tint",
    rotate: "rotate-[-1deg]",
  },
  {
    icon: MdSportsSoccer,
    title: "Match Confirmation",
    description: "Opponents confirm or dispute results — no cheating allowed.",
    fill: "bg-peach",
    rotate: "rotate-[1deg]",
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
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="h-8 w-8 animate-spin border-[3px] border-ink border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className="animate-in brut-shadow-lg mb-8">
            <BrandMark size="lg" />
          </div>

          <h1 className="animate-in mb-4 text-5xl font-bold tracking-tight text-ink sm:text-7xl">
            Foos<span className="text-team-red">Rank</span>
          </h1>

          <p
            className="animate-in mb-3 text-lg font-semibold text-ink-soft sm:text-xl"
            style={{ animationDelay: "50ms" }}
          >
            ELO-based office foosball rankings
          </p>

          <p
            className="animate-in mb-10 max-w-lg text-sm font-medium leading-relaxed text-ink-muted"
            style={{ animationDelay: "100ms" }}
          >
            Create leagues, record matches, track your rating, and earn achievements.
            Fair rankings powered by the same system used in chess.
          </p>

          <div
            className="animate-in flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
            style={{ animationDelay: "150ms" }}
          >
            <Link
              to="/login"
              className="brut-border btn-press brut-shadow-lg min-h-[48px] bg-ink px-8 py-3 text-sm font-bold uppercase tracking-wide text-paper transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="brut-border btn-press brut-shadow-lg min-h-[48px] bg-team-blue-tint px-8 py-3 text-sm font-bold uppercase tracking-wide text-ink transition-colors"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="animate-in mb-10 text-center text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Everything you need to run a league
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feat, i) => (
              <div
                key={feat.title}
                className={`animate-in card-interactive brut-border brut-shadow ${feat.fill} ${feat.rotate} p-5`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center border-2 border-ink bg-card text-ink">
                  <feat.icon size={24} />
                </div>
                <h3 className="mb-1 text-base font-bold text-ink">
                  {feat.title}
                </h3>
                <p className="text-sm font-medium leading-relaxed text-ink-soft">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How ELO works */}
      <section className="border-y-2 border-ink bg-paper-alt px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-lg">
          <h2 className="mb-2 text-center text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            How ELO Works
          </h2>
          <p className="mb-8 text-center text-sm font-medium text-ink-soft">
            Everyone starts at 1200. Win and go up, lose and go down.
          </p>
          <EloExample />
        </div>
      </section>

      {/* What's New */}
      {changelog.length > 0 && (
        <section className="px-4 py-12 sm:py-16">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-8 text-center text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              What&apos;s New
            </h2>
            <div className="space-y-4">
              {changelog.map((entry, i) => (
                <div
                  key={entry.version}
                  className="animate-in brut-border brut-shadow bg-card p-4"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="mb-2 flex items-center gap-3">
                    <span className="border-2 border-ink bg-butter px-2 py-0.5 font-mono text-xs font-bold text-ink">
                      v{entry.version}
                    </span>
                    <span className="font-mono text-xs font-semibold text-ink-muted">
                      {formatDate(entry.date)}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {entry.summary.map((item, j) => (
                      <li key={j} className="flex gap-2 text-sm font-medium text-ink-soft">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-ink" />
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
                className="text-sm font-bold uppercase tracking-wide text-ink underline"
              >
                View all updates
              </Link>
            </div>
          </div>
        </section>
      )}

      <footer className="border-t-2 border-ink px-4 py-6 text-center font-mono text-xs text-ink-muted">
        <Link to="/privacy" className="transition-colors hover:text-ink">
          Privacy
        </Link>
        <span className="mx-2">·</span>
        <Link to="/changelog" className="transition-colors hover:text-ink">
          FoosRank v{__APP_VERSION__}
        </Link>
      </footer>
    </div>
  );
};
