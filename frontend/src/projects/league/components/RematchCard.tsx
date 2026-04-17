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
      className="mb-6 flex flex-col gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex-1">
        <p className="text-sm font-semibold text-text-primary">
          Rematch vs {opponentLabel}
        </p>
        <p className="mt-0.5 text-xs text-text-muted">
          {teammateLabel ? `With ${teammateLabel} · ` : ""}
          Last result: {score} {userWon ? "win" : "loss"}
        </p>
        {hasMissing && (
          <p className="mt-1 text-xs text-warning">
            Some players are no longer in this league — their slots will be left empty.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onApply}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        <MdReplay size={16} />
        Fill teams
      </button>
    </section>
  );
};
