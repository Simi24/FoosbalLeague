const COLORS = [
  "bg-red-400", "bg-orange-400", "bg-amber-400", "bg-yellow-400",
  "bg-lime-400", "bg-green-400", "bg-emerald-400", "bg-teal-400",
  "bg-cyan-400", "bg-sky-400", "bg-blue-400", "bg-indigo-400",
  "bg-violet-400", "bg-purple-400", "bg-fuchsia-400", "bg-pink-400",
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
  sm: "h-7 w-7 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-12 w-12 text-base",
};

export const Avatar = ({ name, size = "md" }: AvatarProps) => {
  const color = COLORS[hashName(name) % COLORS.length]!;
  const initials = getInitials(name);

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${color} ${SIZES[size]}`}
    >
      {initials}
    </div>
  );
};
