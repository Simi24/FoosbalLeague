import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MdAdd, MdCheck, MdClose, MdHistory, MdLeaderboard, MdLogout } from "react-icons/md";

import { apiFetch } from "@/api";
import { useAppSelector } from "@/app/hooks";
import type { League, LeagueMember, Match } from "../types";

export const LeagueDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [league, setLeague] = useState<League | null>(null);
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    if (!id) return;
    setLoading(true);
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
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const playerNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of members) {
      map[m.player_id] = m.display_name;
    }
    return map;
  }, [members]);

  const resolveName = (id: string) => playerNames[id] ?? id;

  const currentMember = members.find((m) => m.player_id === user?.player_id);
  const isAdmin = currentMember?.role === "admin";

  const handleConfirm = async (matchId: string) => {
    const res = await apiFetch(`/matches/${matchId}/confirm`, { method: "POST" });
    if (res.ok) fetchData();
  };

  const handleDispute = async (matchId: string) => {
    const res = await apiFetch(`/matches/${matchId}/dispute`, { method: "POST" });
    if (res.ok) fetchData();
  };

  const handleLeave = async () => {
    const res = await apiFetch(`/leagues/${id}/leave`, { method: "POST" });
    if (res.ok) navigate("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }
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
          {currentMember && !isAdmin && (
            <button
              onClick={handleLeave}
              className="flex items-center gap-2 rounded-lg border border-danger/30 px-3 py-2.5 text-sm text-danger transition-colors hover:bg-danger/5"
            >
              <MdLogout size={16} /> Leave
            </button>
          )}
          <Link
            to={`/leagues/${id}/leaderboard`}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          >
            <MdLeaderboard size={16} /> Leaderboard
          </Link>
          <Link
            to={`/leagues/${id}/match/new`}
            className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <MdAdd size={16} /> Record Match
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Members */}
        <div className="rounded-xl border border-border bg-bg-secondary p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            Members
          </h2>
          {members.length === 0 ? (
            <p className="text-sm text-text-muted">No members yet.</p>
          ) : (
            <div className="space-y-1">
              {members.map((m) => (
                <Link
                  key={m.player_id}
                  to={`/players/${m.player_id}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-bg-tertiary"
                >
                  <span className="text-sm text-text-primary">
                    {m.display_name}
                    {m.role === "admin" && (
                      <span className="ml-2 rounded-full bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">admin</span>
                    )}
                  </span>
                  <span className="text-sm font-mono font-semibold text-accent">
                    {m.current_elo}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Matches */}
        <div className="rounded-xl border border-border bg-bg-secondary p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">
              Recent Matches
            </h2>
            {matches.length > 5 && (
              <Link
                to={`/leagues/${id}/matches`}
                className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover"
              >
                <MdHistory size={14} /> View all
              </Link>
            )}
          </div>
          {matches.length === 0 ? (
            <p className="text-sm text-text-muted">No matches yet.</p>
          ) : (
            <div className="space-y-1">
              {matches.slice(0, 10).map((m) => (
                <div
                  key={m.match_id}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-bg-tertiary"
                >
                  <span className="text-text-primary">
                    {m.team1_player_ids.map(resolveName).join(", ")} vs{" "}
                    {m.team2_player_ids.map(resolveName).join(", ")}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold text-accent">
                      {m.team1_score} &ndash; {m.team2_score}
                    </span>
                    {m.status === "PENDING" && isAdmin ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleConfirm(m.match_id)}
                          className="rounded-full bg-success/10 p-1 text-success transition-colors hover:bg-success/20"
                          title="Confirm"
                        >
                          <MdCheck size={16} />
                        </button>
                        <button
                          onClick={() => handleDispute(m.match_id)}
                          className="rounded-full bg-danger/10 p-1 text-danger transition-colors hover:bg-danger/20"
                          title="Dispute"
                        >
                          <MdClose size={16} />
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.status === "CONFIRMED"
                            ? "bg-success/10 text-success"
                            : m.status === "DISPUTED"
                              ? "bg-danger/10 text-danger"
                              : "bg-warning/10 text-warning"
                        }`}
                      >
                        {m.status}
                      </span>
                    )}
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
