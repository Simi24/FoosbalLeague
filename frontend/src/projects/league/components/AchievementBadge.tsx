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
    bg: "from-slate-800 to-slate-700",
    border: "border-slate-500",
    glow: "",
    label: "Common",
  },
  rare: {
    bg: "from-blue-900 to-blue-800",
    border: "border-blue-500",
    glow: "shadow-blue-500/20",
    label: "Rare",
  },
  epic: {
    bg: "from-purple-900 to-purple-800",
    border: "border-purple-500",
    glow: "shadow-purple-500/20",
    label: "Epic",
  },
  legendary: {
    bg: "from-amber-900 via-yellow-900 to-amber-800",
    border: "border-amber-500",
    glow: "shadow-amber-500/20",
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
            : "from-gray-800 to-gray-900 border-gray-700 opacity-40"
        }`}
        title={`${name} — ${description}`}
      >
        <IconComponent
          size={24}
          className={unlocked ? "text-gray-200" : "text-gray-500"}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl border-2 bg-gradient-to-br p-4 transition-transform hover:scale-[1.02] ${
        unlocked
          ? `${style.bg} ${style.border} ${style.glow} shadow-md`
          : "from-gray-800 to-gray-900 border-gray-700 opacity-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
            unlocked ? "bg-white/10" : "bg-gray-700/40"
          }`}
        >
          <IconComponent
            size={28}
            className={unlocked ? "text-gray-200" : "text-gray-500"}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={`text-sm font-bold ${
                unlocked ? "text-gray-100" : "text-gray-500"
              }`}
            >
              {name}
            </h3>
            {unlocked && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  rarity === "legendary"
                    ? "bg-amber-500/20 text-amber-300"
                    : rarity === "epic"
                      ? "bg-purple-500/20 text-purple-300"
                      : rarity === "rare"
                        ? "bg-blue-500/20 text-blue-300"
                        : "bg-slate-500/20 text-slate-400"
                }`}
              >
                {style.label}
              </span>
            )}
          </div>
          <p
            className={`mt-0.5 text-xs ${
              unlocked ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {description}
          </p>
        </div>
      </div>
      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <MdLock size={20} className="text-gray-600" />
        </div>
      )}
    </div>
  );
};
