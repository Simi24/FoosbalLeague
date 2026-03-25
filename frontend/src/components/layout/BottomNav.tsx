import { NavLink } from "react-router-dom";
import {
  MdDashboard,
  MdLeaderboard,
  MdSportsSoccer,
  MdPerson,
  MdSettings,
} from "react-icons/md";

const navItems = [
  { to: "/dashboard", icon: MdDashboard, label: "Dashboard" },
  { to: "/leagues", icon: MdSportsSoccer, label: "Leagues" },
  { to: "/leaderboard", icon: MdLeaderboard, label: "Board" },
  { to: "/profile", icon: MdPerson, label: "Profile" },
  { to: "/settings", icon: MdSettings, label: "Settings" },
];

export const BottomNav = () => (
  <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-bg-secondary md:hidden">
    {navItems.map(({ to, icon: Icon, label }) => (
      <NavLink
        key={to}
        to={to}
        end
        className={({ isActive }) =>
          `relative flex flex-col items-center gap-0.5 px-2 py-1 transition-colors duration-200 ${
            isActive
              ? "text-accent font-medium"
              : "text-text-muted"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Icon size={20} />
            <span className="text-[10px]">{label}</span>
            {isActive && (
              <span className="absolute bottom-1 h-1 w-1 rounded-full bg-accent" />
            )}
          </>
        )}
      </NavLink>
    ))}
  </nav>
);
