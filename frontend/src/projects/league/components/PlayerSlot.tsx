import { MdAdd, MdClose } from "react-icons/md";

export type SlotPlayer = {
  player_id: string;
  display_name: string;
  current_elo: number;
};

type TeamNumber = 1 | 2;

interface Props {
  team: TeamNumber;
  slotIndex: number;
  player: SlotPlayer | null;
  delta?: number;
  onTap: () => void;
  onRemove: () => void;
}

const slotStyle: Record<
  TeamNumber,
  { filled: string; empty: string }
> = {
  1: {
    filled: "border-team-blue bg-team-blue-tint",
    empty:
      "border-team-blue bg-card hover:bg-team-blue-tint text-team-blue",
  },
  2: {
    filled: "border-team-red bg-team-red-tint",
    empty:
      "border-team-red bg-card hover:bg-team-red-tint text-team-red",
  },
};

export const PlayerSlot = ({ team, slotIndex, player, delta, onTap, onRemove }: Props) => {
  const teamLabel = `Team ${team}`;
  const s = slotStyle[team];

  if (!player) {
    return (
      <button
        type="button"
        onClick={onTap}
        aria-label={`Add player to ${teamLabel}, slot ${slotIndex + 1}`}
        className={`btn-press flex min-h-[56px] w-full items-center justify-center gap-2 border-[2px] border-dashed ${s.empty} px-3 py-3 text-sm font-semibold uppercase tracking-wide transition-colors`}
      >
        <MdAdd size={20} />
        <span>Add player</span>
      </button>
    );
  }

  const deltaClass =
    delta === undefined
      ? ""
      : delta >= 0
        ? "text-success"
        : "text-danger";

  return (
    <div
      className={`flex min-h-[56px] w-full items-center gap-3 border-2 ${s.filled} px-3 py-2`}
    >
      <button
        type="button"
        onClick={onTap}
        aria-label={`Change player in ${teamLabel}, slot ${slotIndex + 1}`}
        className="flex flex-1 items-center gap-2 text-left"
      >
        <span className="text-sm font-bold text-ink">{player.display_name}</span>
        <span className="font-mono text-xs font-semibold text-ink-soft">
          {player.current_elo}
        </span>
        {delta !== undefined && (
          <span className={`ml-auto font-mono text-xs font-bold ${deltaClass}`}>
            {delta >= 0 ? `+${delta}` : delta}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove player from ${teamLabel}, slot ${slotIndex + 1}`}
        className="btn-press border-2 border-transparent p-1 text-ink transition-colors hover:border-ink hover:bg-coral"
      >
        <MdClose size={16} />
      </button>
    </div>
  );
};
