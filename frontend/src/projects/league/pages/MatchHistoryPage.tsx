import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MdArrowBack, MdCheck, MdClose } from "react-icons/md";

import { apiFetch } from "@/api";
import { useAppSelector } from "@/app/hooks";
import type { League, LeagueMember, Match } from "../types";

export const MatchHistoryPage = () => {
  const { id } = useParams<{ id: string }>();
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

  const resolveName = (pid: string) => playerNames[pid] ?? pid;

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link
          to={`/leagues/${id}`}
          className="rounded-lg border border-border p-2 text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        >
          <MdArrowBack size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Match History</h1>
          {league && (
            <p className="text-sm text-text-secondary">{league.name} &middot; {matches.length} matches</p>
          )}
        </div>
      </div>

      {matches.length === 0 ? (
        <p className="text-sm text-text-muted">No matches yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-bg-secondary shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-sm text-text-secondary">
                <th className="px-4 py-3">Team 1</th>
                <th className="px-4 py-3 text-center">Score</th>
                <th className="px-4 py-3">Team 2</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => {
                const date = new Date(m.created_at);
                const isTeam1Winner = m.team1_score > m.team2_score;
                return (
                  <tr
                    key={m.match_id}
                    className="border-b border-border/50 transition-colors hover:bg-bg-tertiary"
                  >
                    <td className={`px-4 py-3 text-sm ${isTeam1Winner && m.status === "CONFIRMED" ? "font-semibold text-text-primary" : "text-text-secondary"}`}>
                      {m.team1_player_ids.map(resolveName).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-sm font-semibold text-accent">
                      {m.team1_score} &ndash; {m.team2_score}
                    </td>
                    <td className={`px-4 py-3 text-sm ${!isTeam1Winner && m.status === "CONFIRMED" ? "font-semibold text-text-primary" : "text-text-secondary"}`}>
                      {m.team2_player_ids.map(resolveName).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {m.status === "PENDING" && isAdmin ? (
                        <div className="flex items-center justify-center gap-1">
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
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-text-muted">
                      {date.toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
