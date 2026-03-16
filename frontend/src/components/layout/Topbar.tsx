import { Link } from "react-router-dom";
import { MdMenu } from "react-icons/md";

import { useAppSelector } from "@/app/hooks";
import { Avatar } from "@/components/Avatar";

type TopbarProps = {
  onMenuClick: () => void;
};

export const Topbar = ({ onMenuClick }: TopbarProps) => {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <header className="fixed left-0 right-0 top-0 z-10 flex h-14 items-center justify-between bg-bg-secondary px-4 shadow-sm md:left-56 md:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary md:hidden"
      >
        <MdMenu size={22} />
      </button>
      <div className="hidden md:block" />
      <Link to="/profile" className="flex items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-bg-tertiary">
        <span className="text-sm text-text-secondary">
          {user?.name ?? "Guest"}
        </span>
        <Avatar name={user?.name ?? "?"} />
      </Link>
    </header>
  );
};
