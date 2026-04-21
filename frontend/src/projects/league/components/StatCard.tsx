type StatCardProps = {
  label: string;
  value: string | number;
  color?: string;
  tone?: "default" | "blue" | "red" | "mint" | "butter" | "lavender" | "peach";
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
}: StatCardProps) => (
  <div className={`brut-border brut-shadow ${TONE_BG[tone]} p-3 sm:p-4`}>
    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
      {label}
    </p>
    <p className={`mt-1 font-mono text-xl font-bold sm:text-2xl ${color}`}>
      {value}
    </p>
  </div>
);
