import { useCallback, useEffect, useRef, useState } from "react";
import { MdArrowDownward, MdArrowUpward } from "react-icons/md";

import { Avatar } from "./Avatar";

interface PlayerResult {
  name: string;
  before: number;
  after: number;
}

interface MatchExampleData {
  left: PlayerResult;
  right: PlayerResult;
  score: [number, number];
  insight: string;
}

const matches: MatchExampleData[] = [
  {
    left: { name: "Marco", before: 1200, after: 1224 },
    right: { name: "Luca", before: 1350, after: 1332 },
    score: [10, 7],
    insight: "Beat a stronger opponent? You earn more points. A 150-point gap made this upset worth +24.",
  },
  {
    left: { name: "Sara", before: 1400, after: 1408 },
    right: { name: "Alex", before: 1180, after: 1172 },
    score: [10, 5],
    insight: "Win against a weaker opponent and you gain less — the system expected you to win.",
  },
  {
    left: { name: "Giulia", before: 1200, after: 1232 },
    right: { name: "Tom", before: 1200, after: 1182 },
    score: [10, 9],
    insight: "New players (under 10 games) have K=40, so ratings change faster. Veterans (30+ games) use K=24 for stability.",
  },
];

const MatchCard = ({ left, right, score, insight }: MatchExampleData) => {
  const leftDelta = left.after - left.before;
  const rightDelta = right.after - right.before;
  const leftWon = score[0] > score[1];

  return (
    <div className="w-full shrink-0 snap-center px-2">
      <div className="rounded-xl border border-border bg-bg-secondary p-5 shadow-sm">
        {/* Players & score */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex flex-1 flex-col items-center gap-1.5">
            <Avatar name={left.name} size="lg" />
            <span className="text-sm font-semibold text-text-primary">{left.name}</span>
            <span className="font-mono text-xs text-text-muted">{left.before} ELO</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-baseline gap-1.5">
              <span className={`font-mono text-2xl font-bold ${leftWon ? "text-success" : "text-text-muted"}`}>
                {score[0]}
              </span>
              <span className="text-sm text-text-muted">-</span>
              <span className={`font-mono text-2xl font-bold ${!leftWon ? "text-success" : "text-text-muted"}`}>
                {score[1]}
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-text-muted">final</span>
          </div>

          <div className="flex flex-1 flex-col items-center gap-1.5">
            <Avatar name={right.name} size="lg" />
            <span className="text-sm font-semibold text-text-primary">{right.name}</span>
            <span className="font-mono text-xs text-text-muted">{right.before} ELO</span>
          </div>
        </div>

        <div className="mb-4 border-t border-border/50" />

        {/* Results */}
        <div className="mb-3 grid grid-cols-2 gap-3">
          <ResultBadge name={left.name} before={left.before} after={left.after} delta={leftDelta} />
          <ResultBadge name={right.name} before={right.before} after={right.after} delta={rightDelta} />
        </div>

        {/* Insight */}
        <p className="text-center text-xs leading-relaxed text-text-muted">
          {insight}
        </p>
      </div>
    </div>
  );
};

const ResultBadge = ({ name, before, after, delta }: { name: string; before: number; after: number; delta: number }) => {
  const isGain = delta > 0;

  return (
    <div className={`rounded-lg p-2.5 ${isGain ? "bg-success/5" : "bg-danger/5"}`}>
      <div className="mb-1 text-center text-[10px] font-medium text-text-muted">{name}</div>
      <div className="flex items-center justify-center gap-1.5">
        <span className="font-mono text-xs text-text-muted">{before}</span>
        <span className="text-text-muted">&rarr;</span>
        <span className="font-mono text-xs font-semibold text-text-primary">{after}</span>
        <span className={`flex items-center font-mono text-xs font-bold ${isGain ? "text-success" : "text-danger"}`}>
          {isGain ? <MdArrowUpward size={12} /> : <MdArrowDownward size={12} />}
          {Math.abs(delta)}
        </span>
      </div>
    </div>
  );
};

export const EloExample = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.offsetWidth);
    setActive(index);
  }, []);

  const scrollTo = useCallback((index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.offsetWidth, behavior: "smooth" });
  }, []);

  // Auto-advance every 6s, pause on interaction
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % matches.length;
        scrollTo(next);
        return next;
      });
    }, 6000);
  }, [scrollTo]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  const handleDotClick = (index: number) => {
    scrollTo(index);
    resetTimer();
  };

  const handleUserScroll = () => {
    handleScroll();
    resetTimer();
  };

  return (
    <div>
      <div
        ref={scrollRef}
        onScroll={handleUserScroll}
        className="-mx-2 flex snap-x snap-mandatory overflow-x-auto scrollbar-none"
        style={{ scrollbarWidth: "none" }}
      >
        {matches.map((m) => (
          <MatchCard key={m.left.name} {...m} />
        ))}
      </div>

      {/* Dots */}
      <div className="mt-4 flex justify-center gap-2">
        {matches.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleDotClick(i)}
            aria-label={`Example ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === active
                ? "w-6 bg-accent"
                : "w-2 bg-border hover:bg-text-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
