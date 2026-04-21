const PASTELS = [
  "bg-team-blue-tint",
  "bg-team-red-tint",
  "bg-mint",
  "bg-butter",
  "bg-lavender",
  "bg-peach",
  "bg-coral",
];

const hashName = (name: string): number => {
  let hash = 0;
  for (const ch of name) {
    hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  }
  return Math.abs(hash);
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

type AvatarProps = {
  name: string;
  size?: "sm" | "md" | "lg";
};

const SIZES = {
  sm: "h-7 w-7 text-[10px] border-[1.5px]",
  md: "h-9 w-9 text-xs border-2",
  lg: "h-14 w-14 text-base border-2",
};

export const Avatar = ({ name, size = "md" }: AvatarProps) => {
  const fill = PASTELS[hashName(name) % PASTELS.length]!;
  const initials = getInitials(name);

  return (
    <div
      className={`flex shrink-0 items-center justify-center border-ink font-bold text-ink ${fill} ${SIZES[size]}`}
    >
      {initials}
    </div>
  );
};
