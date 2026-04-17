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

const labelColor: Record<TeamNumber, string> = {
  1: "text-team-blue",
  2: "text-team-red",
};

export const TeamCard = ({ team, label, slots, deltas, onSlotTap, onSlotRemove }: Props) => {
  return (
    <section className="flex-1" aria-label={label}>
      <h3 className={`mb-2 text-sm font-semibold ${labelColor[team]}`}>{label}</h3>
      <div className="space-y-2">
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
