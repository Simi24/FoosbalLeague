import type { StreakInfo } from "../../types";

type Props = {
  streak: StreakInfo;
  size?: "default" | "compact";
};

export const StreakCard = ({ streak, size = "default" }: Props) => {
  const winning = streak.current > 0;
  const losing = streak.current < 0;
  const magnitude = Math.abs(streak.current);

  const bg = winning ? "bg-mint" : losing ? "bg-coral" : "bg-card";
  const valueColor = winning
    ? "text-success"
    : losing
      ? "text-danger"
      : "text-ink-muted";
  const display =
    magnitude === 0 ? "–" : `${winning ? "W" : "L"}${magnitude}`;

  const compact = size === "compact";
  const padding = compact ? "px-2 py-1.5" : "p-3 sm:p-4";
  const valueSize = compact ? "text-base" : "text-xl sm:text-2xl";
  const shadow = compact ? "" : "brut-shadow";
  const labelSize = compact ? "text-[9px]" : "text-[10px]";

  return (
    <div
      className={`brut-border ${shadow} ${bg} ${padding}`}
      title={`Longest win streak: ${streak.longest_win}`}
    >
      <p
        className={`${labelSize} font-bold uppercase tracking-wider text-ink-soft`}
      >
        Streak
      </p>
      <p className={`mt-0.5 font-mono font-bold ${valueSize} ${valueColor}`}>
        {display}
      </p>
      {!compact && (
        <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-ink-soft">
          Longest win:{" "}
          <span className="font-mono text-ink">{streak.longest_win}</span>
        </p>
      )}
    </div>
  );
};
