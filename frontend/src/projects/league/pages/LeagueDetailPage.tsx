import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MdAdd, MdLeaderboard } from "react-icons/md";

import { apiFetch } from "@/api";
import type { League, LeagueMember, Match } from "../types";

export const LeagueDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [league, setLeague] = useState<League | null>(null);
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      apiFetch(`/leagues/${id}`).then((r) => r.json()),
      apiFetch(`/leagues/${id}/members`).then((r) => r.json()),
      apiFetch(`/matches/league/${id}`).then((r) => r.json()),
    ])
      .then(([lg, mem, mat]) => {
        setLeague(lg);
        setMembers(mem);
        setMatches(mat);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-text-muted">Loading...</p>;
  if (!league) return <p className="text-danger">League not found</p>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {league.name}
          </h1>
          <p className="text-sm text-text-secondary">
            {league.league_type} &middot; {league.member_count} members &middot;{" "}
            {league.match_count} matches
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/leagues/${id}/leaderboard`}
            className="flex items-center gap-2 rounded border border-border px-3 py-2 text-sm text-text-secondary transition-all hover:border-neon-green hover:text-neon-green"
          >
            <MdLeaderboard size={16} /> Leaderboard
          </Link>
          <Link
            to={`/leagues/${id}/match/new`}
            className="flex items-center gap-2 rounded border border-neon-green px-3 py-2 text-sm text-neon-green transition-all hover:bg-neon-green hover:text-bg-primary"
          >
            <MdAdd size={16} /> Record Match
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Members */}
        <div className="rounded border border-border bg-bg-secondary p-5">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            Members
          </h2>
          {members.length === 0 ? (
            <p className="text-sm text-text-muted">No members yet.</p>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <Link
                  key={m.player_id}
                  to={`/players/${m.player_id}`}
                  className="flex items-center justify-between rounded px-3 py-2 transition-colors hover:bg-bg-tertiary"
                >
                  <span className="text-sm text-text-primary">
                    {m.display_name}
                    {m.role === "admin" && (
                      <span className="ml-2 text-xs text-warning">admin</span>
                    )}
                  </span>
                  <span className="text-sm font-mono text-neon-green">
                    {m.current_elo}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Matches */}
        <div className="rounded border border-border bg-bg-secondary p-5">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            Recent Matches
          </h2>
          {matches.length === 0 ? (
            <p className="text-sm text-text-muted">No matches yet.</p>
          ) : (
            <div className="space-y-2">
              {matches.slice(0, 10).map((m) => (
                <div
                  key={m.match_id}
                  className="flex items-center justify-between rounded px-3 py-2 text-sm hover:bg-bg-tertiary"
                >
                  <span className="text-text-primary">
                    {m.team1_player_ids.join(", ")} vs{" "}
                    {m.team2_player_ids.join(", ")}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-neon-green">
                      {m.team1_score} - {m.team2_score}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        m.status === "CONFIRMED"
                          ? "bg-success/10 text-success"
                          : m.status === "DISPUTED"
                            ? "bg-danger/10 text-danger"
                            : "bg-warning/10 text-warning"
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
