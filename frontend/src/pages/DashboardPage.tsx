import { useAppSelector } from "@/app/hooks";
import { Link } from "react-router-dom";
import { MdSportsSoccer, MdLeaderboard, MdAdd } from "react-icons/md";

export const DashboardPage = () => {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-text-primary">
        Welcome back{user?.name ? `, ${user.name}` : ""}
      </h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          to="/leagues"
          className="group rounded border border-border bg-bg-secondary p-6 transition-all hover:border-neon-green"
        >
          <MdSportsSoccer
            size={24}
            className="mb-3 text-neon-green"
          />
          <h2 className="mb-1 text-lg font-semibold text-text-primary">
            Leagues
          </h2>
          <p className="text-sm text-text-secondary">
            Browse and join active leagues
          </p>
        </Link>

        <Link
          to="/leaderboard"
          className="group rounded border border-border bg-bg-secondary p-6 transition-all hover:border-neon-green"
        >
          <MdLeaderboard
            size={24}
            className="mb-3 text-neon-green"
          />
          <h2 className="mb-1 text-lg font-semibold text-text-primary">
            Leaderboard
          </h2>
          <p className="text-sm text-text-secondary">
            Check the rankings
          </p>
        </Link>

        <Link
          to="/leagues"
          className="group rounded border border-border bg-bg-secondary p-6 transition-all hover:border-neon-green"
        >
          <MdAdd size={24} className="mb-3 text-neon-green" />
          <h2 className="mb-1 text-lg font-semibold text-text-primary">
            New Match
          </h2>
          <p className="text-sm text-text-secondary">
            Record a match result
          </p>
        </Link>
      </div>

      <div className="mt-8 rounded border border-border bg-bg-secondary p-6">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Recent Matches
        </h2>
        <p className="text-sm text-text-muted">No recent matches yet.</p>
      </div>
    </div>
  );
};
