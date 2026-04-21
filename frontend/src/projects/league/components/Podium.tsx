import type { RankingEntry } from "../types";
import { PodiumCard } from "./PodiumCard";

type PodiumProps = {
  entries: RankingEntry[];
};

const FILLS: Record<number, string> = {
  1: "bg-butter",
  2: "bg-lavender",
  3: "bg-peach",
};

// Visual order on sm+: 2 · 1 · 3 (classic podium). Mobile: 1 · 2 · 3 stacked.
const SM_ORDER: Record<number, string> = {
  1: "sm:order-2",
  2: "sm:order-1",
  3: "sm:order-3",
};

export const Podium = ({ entries }: PodiumProps) => {
  const top3 = entries.filter((e) => e.rank <= 3);
  if (top3.length === 0) return null;

  return (
    <section
      aria-label="Top players"
      className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end sm:gap-4"
    >
      {top3.map((entry) => (
        <div
          key={entry.player_id}
          className={`${SM_ORDER[entry.rank]} ${entry.rank === 1 ? "sm:-mt-4" : ""}`}
        >
          <PodiumCard
            entry={entry}
            fill={FILLS[entry.rank]!}
            emphasize={entry.rank === 1}
          />
        </div>
      ))}
    </section>
  );
};
