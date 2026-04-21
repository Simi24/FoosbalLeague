import { Link } from "react-router-dom";

import { useAppSelector } from "@/app/hooks";
import { Avatar } from "@/components/Avatar";
import { BrandMark } from "./BrandMark";

export const Topbar = () => {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <header className="fixed left-0 right-0 top-0 z-10 flex h-14 items-center justify-between border-b-2 border-ink bg-paper px-4 md:left-56 md:px-6">
      <Link to="/dashboard" className="flex items-center gap-2 md:hidden">
        <BrandMark size="sm" />
        <span className="text-lg font-bold tracking-tight text-ink">
          Foos<span className="text-team-red">League</span>
        </span>
      </Link>
      <div className="hidden md:block" />
      <Link
        to="/profile"
        className="btn-press flex items-center gap-3 border-2 border-transparent px-2 py-1 text-ink transition-colors hover:border-ink hover:bg-butter"
      >
        <span className="text-sm font-medium">{user?.name ?? "Guest"}</span>
        <Avatar name={user?.name ?? "?"} />
      </Link>
    </header>
  );
};
