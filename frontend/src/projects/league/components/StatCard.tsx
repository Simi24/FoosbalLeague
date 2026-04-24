type StatCardProps = {
  label: string;
  value: string | number;
  color?: string;
  tone?: "default" | "blue" | "red" | "mint" | "butter" | "lavender" | "peach";
  size?: "default" | "compact";
};

const TONE_BG: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "bg-card",
  blue: "bg-team-blue-tint",
  red: "bg-team-red-tint",
  mint: "bg-mint",
  butter: "bg-butter",
  lavender: "bg-lavender",
  peach: "bg-peach",
};

export const StatCard = ({
  label,
  value,
  color = "text-ink",
  tone = "default",
  size = "default",
}: StatCardProps) => {
  const padding = size === "compact" ? "px-2 py-1.5" : "p-3 sm:p-4";
  const valueSize = size === "compact" ? "text-base" : "text-xl sm:text-2xl";
  const shadow = size === "compact" ? "" : "brut-shadow";
  const labelSize = size === "compact" ? "text-[9px]" : "text-[10px]";
  return (
    <div className={`brut-border ${shadow} ${TONE_BG[tone]} ${padding}`}>
      <p className={`${labelSize} font-bold uppercase tracking-wider text-ink-soft`}>
        {label}
      </p>
      <p className={`mt-0.5 font-mono font-bold ${valueSize} ${color}`}>
        {value}
      </p>
    </div>
  );
};
