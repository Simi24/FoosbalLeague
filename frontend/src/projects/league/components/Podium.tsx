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

// Mobile: #1 full-width hero on top, #2/#3 side-by-side below.
// sm+: classic 2 · 1 · 3 podium, #1 elevated.
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
      className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:items-end sm:gap-4"
    >
      {top3.map((entry) => (
        <div
          key={entry.player_id}
          className={`${SM_ORDER[entry.rank]} ${
            entry.rank === 1 ? "col-span-2 sm:col-span-1 sm:-mt-4" : ""
          }`}
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
