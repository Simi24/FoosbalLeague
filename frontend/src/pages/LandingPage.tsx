import { Link, Navigate } from "react-router-dom";
import { MdBolt, MdLeaderboard, MdLock } from "react-icons/md";

import { useAppSelector } from "@/app/hooks";
import { BrandMark } from "@/components/layout";

export const LandingPage = () => {
  const { isAuthenticated, status } = useAppSelector((state) => state.auth);

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
      <section className="relative overflow-hidden px-4 pt-16 pb-14 sm:pt-24 sm:pb-20">
        <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className="animate-in brut-shadow-lg mb-8">
            <BrandMark size="lg" />
          </div>

          <p
            className="animate-in mb-4 font-mono text-xs font-bold uppercase tracking-widest text-ink-muted"
            style={{ animationDelay: "30ms" }}
          >
            Foos<span className="text-team-red">Rank</span>
          </p>

          <h1 className="animate-in mb-3 text-3xl font-bold leading-[1.1] tracking-tight text-ink sm:text-4xl md:text-5xl">
            Office foosball, <span className="text-team-red">finally fair</span>.
          </h1>

          <p
            className="animate-in mb-8 text-lg font-semibold leading-snug text-ink-soft sm:text-xl md:text-2xl"
            style={{ animationDelay: "60ms" }}
          >
            Even when half the team works from home.
          </p>

          <p
            className="animate-in mb-10 max-w-xl text-sm font-medium leading-relaxed text-ink-muted sm:text-base"
            style={{ animationDelay: "120ms" }}
          >
            FoosRank uses chess-style ELO ratings to rank everyone in your office, no
            matter who shows up which day. Play whenever you're in, with whoever's there.
            The leaderboard does the rest.
          </p>

          <div
            className="animate-in flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
            style={{ animationDelay: "150ms" }}
          >
            <Link
              to="/signup"
              className="brut-border btn-press brut-shadow-lg min-h-[48px] bg-ink px-8 py-3 text-sm font-bold uppercase tracking-wide text-paper transition-colors"
            >
              Start your office league →
            </Link>
            <Link
              to="/login"
              className="brut-border btn-press brut-shadow-lg min-h-[48px] bg-team-blue-tint px-8 py-3 text-sm font-bold uppercase tracking-wide text-ink transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Built for the hybrid office */}
      <section className="border-y-2 border-ink bg-paper-alt px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Built for the hybrid office
          </h2>
          <p className="mb-4 text-base font-medium leading-relaxed text-ink-soft">
            Tournaments don't work anymore. Half the team is in on Tuesday, the other
            half on Thursday. By the time you've scheduled a bracket, three people have
            called in remote.
          </p>
          <p className="text-base font-medium leading-relaxed text-ink-soft">
            FoosRank doesn't need a bracket. Just play whenever you're in, with whoever's
            there. Every match counts. The ratings adjust automatically. Over weeks and
            months, the rankings reveal who's actually the strongest player — not just
            who happened to be free on tournament day.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            How it works
          </h2>
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="card-interactive brut-border brut-shadow rotate-[-1deg] bg-mint p-5">
              <div className="mb-3 flex h-11 w-11 items-center justify-center border-2 border-ink bg-card text-ink">
                <MdLeaderboard size={24} />
              </div>
              <h3 className="mb-2 text-base font-bold text-ink">
                Real rankings, not vibes.
              </h3>
              <p className="text-sm font-medium leading-relaxed text-ink-soft">
                Same ELO system used in chess. Beat someone stronger? You climb faster.
                Beat a beginner? Smaller gain. The leaderboard reflects skill, not luck.
              </p>
            </div>
            <div className="card-interactive brut-border brut-shadow rotate-[1deg] bg-butter p-5">
              <div className="mb-3 flex h-11 w-11 items-center justify-center border-2 border-ink bg-card text-ink">
                <MdLock size={24} />
              </div>
              <h3 className="mb-2 text-base font-bold text-ink">
                Private to your office.
              </h3>
              <p className="text-sm font-medium leading-relaxed text-ink-soft">
                Your league, your colleagues, your data. Nobody outside sees your matches
                or rankings.
              </p>
            </div>
            <div className="card-interactive brut-border brut-shadow rotate-[-1deg] bg-lavender p-5">
              <div className="mb-3 flex h-11 w-11 items-center justify-center border-2 border-ink bg-card text-ink">
                <MdBolt size={24} />
              </div>
              <h3 className="mb-2 text-base font-bold text-ink">Quick to log.</h3>
              <p className="text-sm font-medium leading-relaxed text-ink-soft">
                Pick the players, enter the score, done. Built to be filled in during the
                walk back to your desk.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard screenshot */}
      <section className="border-y-2 border-ink bg-paper-alt px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="brut-border brut-shadow-lg overflow-hidden bg-card">
            <img
              src="/landing/leaderboard.png"
              alt="FoosRank leaderboard preview"
              className="block w-full"
            />
          </div>
          <p className="mt-6 text-center text-sm font-medium leading-relaxed text-ink-soft sm:text-base">
            A real ranking, updated after every match. Watch your rating climb (or fall)
            over weeks. See who you've beaten, who's beaten you, and exactly how much
            each match was worth.
          </p>
        </div>
      </section>

      {/* Why I built this */}
      <section className="px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Why I built this
          </h2>
          <p className="mb-4 text-base font-medium leading-relaxed text-ink-soft">
            I work in a hybrid office. We have a foosball table that's been the
            unofficial heart of our team's social life. But after we went hybrid,
            organizing tournaments became impossible — there was never a day everyone
            was in.
          </p>
          <p className="mb-4 text-base font-medium leading-relaxed text-ink-soft">
            So we just... played whenever we could. With whoever was there. And nobody
            really knew who was the best anymore.
          </p>
          <p className="mb-6 text-base font-medium leading-relaxed text-ink-soft">
            A few weeks ago I built FoosRank to fix that. We're at 170 matches and
            counting, and the team checks the leaderboard before lunch. Now I'm opening
            it up so other offices can do the same.
          </p>
          <p className="font-mono text-sm font-bold text-ink">— Simone, Italy</p>
        </div>
      </section>

      {/* Stats banner */}
      <section className="border-y-2 border-ink bg-team-red-tint px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 font-mono text-4xl font-bold tracking-tight text-ink sm:text-6xl">
            170 matches in 6 weeks.
          </p>
          <p className="text-base font-bold uppercase tracking-wider text-ink-soft sm:text-lg">
            One office addicted. Yours could be next.
          </p>
        </div>
      </section>

      {/* ELO teaser */}
      <section className="px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Fair rankings, no math required
          </h2>
          <p className="mb-6 text-base font-medium leading-relaxed text-ink-soft">
            Everyone starts at 1200. Win a match, your rating goes up. Lose, it goes
            down. Beat someone stronger than you? You gain more. The system used by
            chess for over a century — now keeping your office honest.
          </p>
          <Link
            to="/how-elo-works"
            className="text-sm font-bold uppercase tracking-wide text-ink underline underline-offset-4 hover:text-team-red"
          >
            Learn more about ELO →
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-y-2 border-ink bg-paper-alt px-4 py-16 sm:py-24">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <h2 className="mb-2 text-3xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
            Stop arguing about who's the best.
          </h2>
          <h2 className="mb-10 text-3xl font-bold leading-tight tracking-tight text-team-red sm:text-5xl">
            Start proving it.
          </h2>
          <Link
            to="/signup"
            className="brut-border btn-press brut-shadow-lg mb-4 min-h-[48px] bg-ink px-8 py-3 text-sm font-bold uppercase tracking-wide text-paper transition-colors"
          >
            Create your office league →
          </Link>
          <p className="font-mono text-xs uppercase tracking-wider text-ink-muted">
            Free. Private. Two minutes to set up.
          </p>
        </div>
      </section>

      <footer className="border-t-2 border-ink px-4 py-6 text-center font-mono text-xs text-ink-muted">
        <div className="mb-2">
          FoosRank · Made by{" "}
          <a
            href="https://www.linkedin.com/in/simone-paolo-petta"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-ink underline underline-offset-2 hover:text-team-red"
          >
            Simone Petta
          </a>
        </div>
        <div>
          <Link to="/privacy" className="transition-colors hover:text-ink">
            Privacy
          </Link>
          <span className="mx-2">·</span>
          <Link to="/changelog" className="transition-colors hover:text-ink">
            v{__APP_VERSION__}
          </Link>
          <span className="mx-2">·</span>
          <a
            href="mailto:hello@foosrank.app"
            className="transition-colors hover:text-ink"
          >
            hello@foosrank.app
          </a>
        </div>
      </footer>
    </div>
  );
};
