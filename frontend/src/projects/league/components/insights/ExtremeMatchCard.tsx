import type { ExtremeMatch } from "../../types";

type Props = {
  label: string;
  match: ExtremeMatch;
  tone: "win" | "loss";
};

export const ExtremeMatchCard = ({ label, match, tone }: Props) => {
  const bg = tone === "win" ? "bg-butter" : "bg-peach";
  const deltaColor = tone === "win" ? "text-success" : "text-danger";
  const deltaSign = match.delta > 0 ? "+" : "";
  const date = new Date(match.created_at).toLocaleDateString();

  return (
    <div className={`brut-border brut-shadow ${bg} p-4`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
        {label}
      </p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className={`font-mono text-3xl font-bold sm:text-4xl ${deltaColor}`}>
          {deltaSign}
          {match.delta}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">
          ELO
        </span>
      </div>
      <p className="mt-2 truncate text-xs font-semibold text-ink">
        vs {match.opponent_names.join(", ")}
      </p>
      <p className="mt-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-ink-soft">
        <span className="font-mono text-sm text-ink">
          {match.team_score}&ndash;{match.opponent_score}
        </span>
        <span className="font-mono">{date}</span>
      </p>
    </div>
  );
};
