import { MdReplay } from "react-icons/md";
import type { RematchInfo } from "../hooks/useRematchPrefill";

interface Props {
  info: RematchInfo;
  currentPlayerId: string;
  playerNames: Map<string, string>;
  onApply: () => void;
}

const nameOr = (map: Map<string, string>, id: string | null) =>
  id === null ? null : (map.get(id) ?? "Unknown");

export const RematchCard = ({
  info,
  currentPlayerId,
  playerNames,
  onApply,
}: Props) => {
  const { lastMatch, team1, team2, hasMissing } = info;
  const userOnTeam1 = lastMatch.team1_player_ids.includes(currentPlayerId);
  const opponents = userOnTeam1 ? team2 : team1;
  const teammates = (userOnTeam1 ? team1 : team2).filter(
    (id) => id !== currentPlayerId,
  );

  const opponentLabel =
    opponents
      .map((id) => nameOr(playerNames, id))
      .filter((s): s is string => !!s)
      .join(" & ") || "last opponents";

  const teammateLabel = teammates
    .map((id) => nameOr(playerNames, id))
    .filter((s): s is string => !!s)
    .join(", ");

  const score = userOnTeam1
    ? `${lastMatch.team1_score}–${lastMatch.team2_score}`
    : `${lastMatch.team2_score}–${lastMatch.team1_score}`;
  const userWon = userOnTeam1
    ? lastMatch.team1_score > lastMatch.team2_score
    : lastMatch.team2_score > lastMatch.team1_score;

  return (
    <section
      aria-label="Rematch shortcut"
      className="brut-border brut-shadow mb-6 flex flex-col gap-3 bg-lavender p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex-1">
        <p className="text-sm font-bold uppercase tracking-wide text-ink">
          Rematch vs {opponentLabel}
        </p>
        <p className="mt-1 text-xs font-medium text-ink-soft">
          {teammateLabel ? `With ${teammateLabel} · ` : ""}
          Last result:{" "}
          <span className="font-mono font-semibold">{score}</span>{" "}
          {userWon ? "win" : "loss"}
        </p>
        {hasMissing && (
          <p className="mt-1 text-xs font-semibold text-warning">
            Some players are no longer in this league — their slots will be left empty.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onApply}
        className="brut-border btn-press brut-shadow inline-flex min-h-[44px] items-center justify-center gap-2 bg-butter px-4 py-2 text-sm font-bold text-ink transition-colors"
      >
        <MdReplay size={18} />
        Fill teams
      </button>
    </section>
  );
};
