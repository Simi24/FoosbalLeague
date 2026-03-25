import { useState } from "react";
import { MdExpandMore } from "react-icons/md";

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const Section = ({ title, defaultOpen = false, children }: SectionProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border/50 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-1 py-3 text-left text-sm font-semibold text-text-primary transition-colors hover:text-accent"
      >
        <span>{title}</span>
        <MdExpandMore
          size={18}
          className={`shrink-0 text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="pb-4 px-1 text-sm leading-relaxed text-text-secondary">
          {children}
        </div>
      )}
    </div>
  );
};

export const EloInfoContent = () => (
  <div className="space-y-0">
    <Section title="Starting Rating" defaultOpen>
      <p>
        Every player starts with an ELO rating of <span className="font-mono font-semibold text-accent">1200</span>.
        Your rating goes up when you win and down when you lose.
      </p>
    </Section>

    <Section title="How Points Change">
      <p className="mb-3">
        New players&apos; ratings change faster so they reach their true skill level quickly.
        As you play more, your rating stabilizes.
      </p>
      <div className="grid grid-cols-3 gap-2 rounded-lg bg-bg-tertiary p-3 text-center">
        <div>
          <div className="text-xs text-text-muted">First 10 games</div>
          <div className="font-mono text-lg font-bold text-accent">K=40</div>
          <div className="text-xs text-text-muted">Fast</div>
        </div>
        <div>
          <div className="text-xs text-text-muted">Games 11-30</div>
          <div className="font-mono text-lg font-bold text-accent">K=32</div>
          <div className="text-xs text-text-muted">Settling</div>
        </div>
        <div>
          <div className="text-xs text-text-muted">After 30 games</div>
          <div className="font-mono text-lg font-bold text-accent">K=24</div>
          <div className="text-xs text-text-muted">Stable</div>
        </div>
      </div>
      <p className="mt-3">
        The higher the K value, the more points you win or lose per match.
      </p>
    </Section>

    <Section title="Expected Outcome">
      <p>
        Before each match, the system calculates who is <em>expected</em> to win based on ratings.
        Beating a stronger opponent earns you more points. Losing to a weaker one costs more.
      </p>
      <p className="mt-2">
        A <span className="font-mono font-semibold text-accent">400</span>-point gap means the stronger
        player is expected to win about 91% of the time.
      </p>
    </Section>

    <Section title="Team Matches (2v2)">
      <p>
        In doubles, the system uses the <strong>team average ELO</strong> to determine expected outcome.
        However, each player&apos;s K-factor is applied individually — a new player on a veteran
        team will still have faster rating changes.
      </p>
    </Section>

    <Section title="Draws">
      <p>
        If a match ends in a draw, the higher-rated player loses a small amount of points
        and the lower-rated player gains them. Draws favor the underdog.
      </p>
    </Section>

    <Section title="Rating Floor">
      <p>
        Your ELO cannot drop below <span className="font-mono font-semibold text-accent">0</span>.
        Even on a losing streak, you&apos;ll never go negative.
      </p>
    </Section>

    <Section title="Achievements">
      <p className="mb-2">
        Earn badges as you play! There are 10 achievements across four rarity tiers:
      </p>
      <div className="flex flex-wrap gap-2">
        {(["Common", "Rare", "Epic", "Legendary"] as const).map((rarity) => (
          <span
            key={rarity}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              rarity === "Common" ? "bg-gray-500/20 text-gray-400" :
              rarity === "Rare" ? "bg-blue-500/20 text-blue-400" :
              rarity === "Epic" ? "bg-purple-500/20 text-purple-400" :
              "bg-amber-500/20 text-amber-400"
            }`}
          >
            {rarity}
          </span>
        ))}
      </div>
      <p className="mt-2 text-text-muted">
        Win your first match, pull off a shutout, climb to #1 — there&apos;s always something to chase.
      </p>
    </Section>
  </div>
);
