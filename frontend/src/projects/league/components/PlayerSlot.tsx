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

const teamBorderFilled: Record<TeamNumber, string> = {
  1: "border-team-blue/40 bg-team-blue/5",
  2: "border-team-red/40 bg-team-red/5",
};

const teamBorderEmpty: Record<TeamNumber, string> = {
  1: "border-team-blue/30 hover:border-team-blue/60 hover:bg-team-blue/5",
  2: "border-team-red/30 hover:border-team-red/60 hover:bg-team-red/5",
};

export const PlayerSlot = ({ team, slotIndex, player, delta, onTap, onRemove }: Props) => {
  const teamLabel = `Team ${team}`;

  if (!player) {
    return (
      <button
        type="button"
        onClick={onTap}
        aria-label={`Add player to ${teamLabel}, slot ${slotIndex + 1}`}
        className={`flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed ${teamBorderEmpty[team]} px-3 py-3 text-sm text-text-muted transition-colors`}
      >
        <MdAdd size={18} />
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
      className={`flex min-h-[56px] w-full items-center gap-3 rounded-xl border ${teamBorderFilled[team]} px-3 py-2`}
    >
      <button
        type="button"
        onClick={onTap}
        aria-label={`Change player in ${teamLabel}, slot ${slotIndex + 1}`}
        className="flex flex-1 items-center gap-2 text-left"
      >
        <span className="text-sm font-medium text-text-primary">
          {player.display_name}
        </span>
        <span className="font-mono text-xs text-text-muted">
          {player.current_elo}
        </span>
        {delta !== undefined && (
          <span className={`ml-auto font-mono text-xs font-semibold ${deltaClass}`}>
            {delta >= 0 ? `+${delta}` : delta}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove player from ${teamLabel}, slot ${slotIndex + 1}`}
        className="rounded-full p-1 text-text-muted transition-colors hover:bg-bg-secondary hover:text-danger"
      >
        <MdClose size={16} />
      </button>
    </div>
  );
};
