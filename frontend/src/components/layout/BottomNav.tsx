import { NavLink } from "react-router-dom";
import {
  MdDashboard,
  MdLeaderboard,
  MdSportsSoccer,
  MdPerson,
  MdSettings,
} from "react-icons/md";

const navItems = [
  { to: "/dashboard", icon: MdDashboard, label: "Home", fill: "bg-butter" },
  { to: "/leagues", icon: MdSportsSoccer, label: "Leagues", fill: "bg-team-red-tint" },
  { to: "/leaderboard", icon: MdLeaderboard, label: "Board", fill: "bg-mint" },
  { to: "/profile", icon: MdPerson, label: "Profile", fill: "bg-team-blue-tint" },
  { to: "/settings", icon: MdSettings, label: "Set", fill: "bg-lavender" },
];

export const BottomNav = () => (
  <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-stretch justify-around border-t-2 border-ink bg-paper md:hidden">
    {navItems.map(({ to, icon: Icon, label, fill }) => (
      <NavLink
        key={to}
        to={to}
        end
        className={({ isActive }) =>
          `relative flex flex-1 flex-col items-center justify-center gap-1 border-l-2 text-ink transition-colors duration-100 first:border-l-0 ${
            isActive ? "bg-paper-alt border-ink font-bold" : "border-ink/10 text-ink-soft"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span
              className={`flex h-8 w-8 items-center justify-center border-2 border-ink text-ink transition-transform ${fill} ${
                isActive ? "brut-shadow -translate-y-0.5" : ""
              }`}
              aria-hidden="true"
            >
              <Icon size={18} />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
          </>
        )}
      </NavLink>
    ))}
  </nav>
);
