import { NavLink } from "react-router-dom";
import {
  MdDashboard,
  MdLeaderboard,
  MdSportsSoccer,
  MdPerson,
  MdSettings,
} from "react-icons/md";

const navItems = [
  { to: "/", icon: MdDashboard, label: "Dashboard" },
  { to: "/leagues", icon: MdSportsSoccer, label: "Leagues" },
  { to: "/leaderboard", icon: MdLeaderboard, label: "Leaderboard" },
  { to: "/profile", icon: MdPerson, label: "Profile" },
];

export const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-full w-56 flex-col border-r border-border bg-bg-secondary md:flex">
      <div className="flex h-14 items-center border-b border-border px-4">
        <span className="text-lg font-bold text-accent">FoosLeague</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-accent-light text-accent font-medium"
                  : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        >
          <MdSettings size={18} />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
};
