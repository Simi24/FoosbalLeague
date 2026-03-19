import { Link } from "react-router-dom";

import { useAppSelector } from "@/app/hooks";
import { Avatar } from "@/components/Avatar";

export const Topbar = () => {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <header className="fixed left-0 right-0 top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-bg-secondary px-4 md:left-56 md:px-6">
      <span className="brand-gradient text-lg font-bold md:hidden">FoosLeague</span>
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
