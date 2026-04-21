import {
  MdLocalFireDepartment,
  MdLock,
  MdMilitaryTech,
  MdRocketLaunch,
  MdSecurity,
  MdShield,
  MdStar,
  MdEmojiEvents,
  MdCastle,
  MdTrackChanges,
} from "react-icons/md";

type AchievementBadgeProps = {
  type: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  unlocked: boolean;
  unlocked_at: string | null;
  compact?: boolean;
};

const RARITY_STYLES: Record<
  string,
  { fill: string; border: string; label: string; chipFill: string }
> = {
  common: {
    fill: "bg-paper-alt",
    border: "border-2 border-ink",
    label: "Common",
    chipFill: "bg-paper-alt",
  },
  rare: {
    fill: "bg-team-blue-tint",
    border: "border-2 border-ink",
    label: "Rare",
    chipFill: "bg-team-blue-tint",
  },
  epic: {
    fill: "bg-lavender",
    border: "border-[3px] border-ink",
    label: "Epic",
    chipFill: "bg-lavender",
  },
  legendary: {
    fill: "bg-butter",
    border: "border-[3px] border-ink",
    label: "Legendary",
    chipFill: "bg-butter",
  },
};

const ICON_MAP: Record<string, React.ComponentType<{ size: number; className?: string }>> = {
  swords: MdMilitaryTech,
  shield: MdShield,
  target: MdTrackChanges,
  lock: MdLock,
  flame: MdLocalFireDepartment,
  castle: MdCastle,
  crown: MdStar,
  fire: MdLocalFireDepartment,
  rocket: MdRocketLaunch,
  trophy: MdEmojiEvents,
  security: MdSecurity,
};

export const AchievementBadge = ({
  name,
  description,
  icon,
  rarity,
  unlocked,
  compact = false,
}: AchievementBadgeProps) => {
  const style = RARITY_STYLES[rarity] ?? RARITY_STYLES.common!;
  const IconComponent = ICON_MAP[icon] ?? MdStar;

  if (compact) {
    return (
      <div
        className={`relative flex h-14 w-14 items-center justify-center ${style.border} ${
          unlocked ? `${style.fill} brut-shadow` : "bg-paper-alt opacity-40"
        }`}
        title={`${name} — ${description}`}
      >
        <IconComponent
          size={26}
          className={unlocked ? "text-ink" : "text-ink-muted"}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${style.border} p-4 ${
        unlocked ? `${style.fill} brut-shadow` : "bg-paper-alt opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center border-2 border-ink ${
            unlocked ? "bg-card" : "bg-paper"
          }`}
        >
          <IconComponent
            size={28}
            className={unlocked ? "text-ink" : "text-ink-muted"}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={`text-sm font-bold ${
                unlocked ? "text-ink" : "text-ink-muted"
              }`}
            >
              {name}
            </h3>
            {unlocked && (
              <span
                className={`border-2 border-ink px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink ${style.chipFill}`}
              >
                {style.label}
              </span>
            )}
          </div>
          <p
            className={`mt-1 text-xs font-medium ${
              unlocked ? "text-ink-soft" : "text-ink-muted"
            }`}
          >
            {description}
          </p>
        </div>
      </div>
      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-paper/60">
          <MdLock size={22} className="text-ink" />
        </div>
      )}
    </div>
  );
};
