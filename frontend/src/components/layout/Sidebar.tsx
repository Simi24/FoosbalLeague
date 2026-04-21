import { Link, NavLink } from "react-router-dom";
import {
  MdDashboard,
  MdLeaderboard,
  MdSportsSoccer,
  MdPerson,
  MdSettings,
} from "react-icons/md";

import { BrandMark } from "./BrandMark";

const navItems = [
  { to: "/dashboard", icon: MdDashboard, label: "Home", fill: "bg-butter" },
  { to: "/leagues", icon: MdSportsSoccer, label: "Leagues", fill: "bg-team-red-tint" },
  { to: "/leaderboard", icon: MdLeaderboard, label: "Leaderboard", fill: "bg-mint" },
  { to: "/profile", icon: MdPerson, label: "Profile", fill: "bg-team-blue-tint" },
];

export const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-full w-56 flex-col border-r-2 border-ink bg-paper md:flex">
      <div className="flex h-14 items-center border-b-2 border-ink px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <BrandMark size="sm" />
          <span className="text-lg font-bold tracking-tight text-ink">
            Foos<span className="text-team-red">League</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-2 p-3">
        {navItems.map(({ to, icon: Icon, label, fill }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-2 py-2 text-sm font-bold transition-all duration-100 ${
                isActive
                  ? "border-2 border-ink bg-card text-ink brut-shadow"
                  : "border-2 border-transparent text-ink-soft hover:border-ink hover:bg-paper-alt hover:text-ink"
              }`
            }
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center border-2 border-ink text-ink ${fill}`}
              aria-hidden="true"
            >
              <Icon size={18} />
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t-2 border-ink p-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-2 py-2 text-sm font-bold transition-colors ${
              isActive
                ? "border-2 border-ink bg-card text-ink brut-shadow"
                : "border-2 border-transparent text-ink-soft hover:border-ink hover:bg-paper-alt hover:text-ink"
            }`
          }
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-ink bg-lavender text-ink"
            aria-hidden="true"
          >
            <MdSettings size={18} />
          </span>
          <span>Settings</span>
        </NavLink>
        <Link
          to="/changelog"
          className="mt-2 block px-3 py-1 font-mono text-xs text-ink-muted transition-colors hover:text-ink"
        >
          v{__APP_VERSION__}
        </Link>
      </div>
    </aside>
  );
};
