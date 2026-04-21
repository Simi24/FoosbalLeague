import { PlayerSlot, type SlotPlayer } from "./PlayerSlot";

type TeamNumber = 1 | 2;

interface Props {
  team: TeamNumber;
  label: string;
  slots: (SlotPlayer | null)[];
  deltas?: Map<string, number>;
  onSlotTap: (slotIndex: number) => void;
  onSlotRemove: (slotIndex: number) => void;
}

const teamStyle: Record<
  TeamNumber,
  { headerBg: string; border: string; labelText: string }
> = {
  1: {
    headerBg: "bg-team-blue-tint",
    border: "border-team-blue",
    labelText: "text-team-blue",
  },
  2: {
    headerBg: "bg-team-red-tint",
    border: "border-team-red",
    labelText: "text-team-red",
  },
};

export const TeamCard = ({ team, label, slots, deltas, onSlotTap, onSlotRemove }: Props) => {
  const s = teamStyle[team];
  return (
    <section
      aria-label={label}
      className={`flex-1 border-[3px] ${s.border} bg-card brut-shadow`}
    >
      <header
        className={`border-b-[3px] ${s.border} ${s.headerBg} px-3 py-2`}
      >
        <h3 className={`text-sm font-bold uppercase tracking-wide ${s.labelText}`}>
          {label}
        </h3>
      </header>
      <div className="space-y-2 p-3">
        {slots.map((player, idx) => (
          <PlayerSlot
            key={idx}
            team={team}
            slotIndex={idx}
            player={player}
            delta={player ? deltas?.get(player.player_id) : undefined}
            onTap={() => onSlotTap(idx)}
            onRemove={() => onSlotRemove(idx)}
          />
        ))}
      </div>
    </section>
  );
};
