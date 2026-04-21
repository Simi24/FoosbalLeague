import { MdSportsSoccer } from "react-icons/md";

type BrandMarkProps = {
  size?: "sm" | "md" | "lg";
};

const SIZES = {
  sm: { box: "h-8 w-8 border-2", icon: 18 },
  md: { box: "h-10 w-10 border-2", icon: 22 },
  lg: { box: "h-16 w-16 border-[3px]", icon: 36 },
};

export const BrandMark = ({ size = "sm" }: BrandMarkProps) => {
  const s = SIZES[size];
  return (
    <span
      className={`flex shrink-0 items-center justify-center border-ink bg-butter text-ink ${s.box}`}
      aria-hidden="true"
    >
      <MdSportsSoccer size={s.icon} />
    </span>
  );
};
