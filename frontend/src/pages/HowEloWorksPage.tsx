import { Link } from "react-router-dom";

import { EloExample } from "@/components/EloExample";
import { Footer } from "@/components/layout";

const h2 = "mb-3 mt-10 text-2xl font-bold tracking-tight text-ink";
const p = "mb-3 text-sm leading-relaxed text-ink-soft";
const strong = "font-bold text-ink";

export const HowEloWorksPage = () => (
  <div className="flex min-h-screen flex-col bg-paper">
    <main className="mx-auto w-full max-w-2xl flex-1 p-4 md:p-8">
      <Link
        to="/"
        className="mb-6 inline-block text-xs font-bold uppercase tracking-wide text-ink-soft hover:text-ink"
      >
        ← Back
      </Link>

      <h1 className="mb-2 text-3xl font-bold tracking-tight text-ink md:text-4xl">
        How ELO works
      </h1>
      <p className="mb-6 text-xs font-mono uppercase tracking-wider text-ink-muted">
        The same system used in chess for over a century
      </p>

      <p className={p}>
        Everyone starts at <span className={strong}>1200</span>. Win a match, your rating
        goes up. Lose, it goes down. Beat someone stronger than you and you gain more.
        Beat a beginner and you gain less. The system is self-correcting: over enough
        matches, ratings settle around your actual skill.
      </p>

      <h2 className={h2}>See it in action</h2>
      <p className={p}>
        Three example matches showing how ratings shift depending on the gap between
        players and how experienced they are.
      </p>
      <EloExample />

      <h2 className={h2}>The math, in plain English</h2>
      <p className={p}>
        Before each match, the system computes an <span className={strong}>expected
        score</span> for each player based on the rating gap. A 200-point favorite is
        expected to win about 76% of the time. A dead-even matchup is 50/50.
      </p>
      <p className={p}>
        After the match, your rating moves in proportion to the difference between what
        actually happened and what was expected. Win a coin-flip match: small bump.
        Upset a 200-point favorite: big bump. Lose a match you were expected to win: big
        drop.
      </p>

      <h2 className={h2}>The K-factor</h2>
      <p className={p}>
        How much your rating moves per match is controlled by a multiplier called{" "}
        <span className={strong}>K</span>. New players use{" "}
        <span className={strong}>K = 40</span> so the system calibrates them quickly —
        the first ten matches do most of the work of placing you on the ladder.
        Veterans (30+ matches) drop to <span className={strong}>K = 24</span> so a
        single bad evening doesn't tank a hard-earned rating.
      </p>

      <h2 className={h2}>Why this works for an office</h2>
      <p className={p}>
        Tournaments fail when half the team is remote. ELO doesn't care about brackets
        or who showed up which day — every match contributes signal, and the rankings
        converge over weeks regardless of attendance. Play whoever is in the office,
        whenever you're in. The numbers do the rest.
      </p>

      <div className="mt-10 mb-4 border-t-2 border-ink/10 pt-6 text-center">
        <Link
          to="/signup"
          className="brut-border btn-press brut-shadow-lg inline-block min-h-[48px] bg-ink px-8 py-3 text-sm font-bold uppercase tracking-wide text-paper transition-colors"
        >
          Start your office league →
        </Link>
      </div>
    </main>
    <Footer />
  </div>
);
