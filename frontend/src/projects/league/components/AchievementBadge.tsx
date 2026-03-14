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

const RARITY_STYLES: Record<string, { bg: string; border: string; glow: string; label: string }> = {
  common: {
    bg: "from-slate-100 to-slate-200",
    border: "border-slate-300",
    glow: "",
    label: "Common",
  },
  rare: {
    bg: "from-blue-100 to-blue-200",
    border: "border-blue-400",
    glow: "shadow-blue-200/50",
    label: "Rare",
  },
  epic: {
    bg: "from-purple-100 to-purple-200",
    border: "border-purple-400",
    glow: "shadow-purple-200/50",
    label: "Epic",
  },
  legendary: {
    bg: "from-amber-100 via-yellow-100 to-amber-200",
    border: "border-amber-400",
    glow: "shadow-amber-200/50",
    label: "Legendary",
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
        className={`group relative flex h-14 w-14 items-center justify-center rounded-xl border-2 bg-gradient-to-br transition-transform hover:scale-110 ${
          unlocked
            ? `${style.bg} ${style.border} ${style.glow} shadow-md`
            : "from-gray-100 to-gray-200 border-gray-200 opacity-40"
        }`}
        title={`${name} — ${description}`}
      >
        <IconComponent
          size={24}
          className={unlocked ? "text-gray-700" : "text-gray-400"}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl border-2 bg-gradient-to-br p-4 transition-transform hover:scale-[1.02] ${
        unlocked
          ? `${style.bg} ${style.border} ${style.glow} shadow-md`
          : "from-gray-50 to-gray-100 border-gray-200 opacity-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
            unlocked ? "bg-white/60" : "bg-gray-200/60"
          }`}
        >
          <IconComponent
            size={28}
            className={unlocked ? "text-gray-700" : "text-gray-400"}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={`text-sm font-bold ${
                unlocked ? "text-gray-800" : "text-gray-400"
              }`}
            >
              {name}
            </h3>
            {unlocked && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  rarity === "legendary"
                    ? "bg-amber-300/50 text-amber-800"
                    : rarity === "epic"
                      ? "bg-purple-300/50 text-purple-800"
                      : rarity === "rare"
                        ? "bg-blue-300/50 text-blue-800"
                        : "bg-slate-300/50 text-slate-600"
                }`}
              >
                {style.label}
              </span>
            )}
          </div>
          <p
            className={`mt-0.5 text-xs ${
              unlocked ? "text-gray-600" : "text-gray-400"
            }`}
          >
            {description}
          </p>
        </div>
      </div>
      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/30">
          <MdLock size={20} className="text-gray-300" />
        </div>
      )}
    </div>
  );
};
