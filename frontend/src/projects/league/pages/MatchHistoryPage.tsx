import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { MdArrowBack, MdCheck, MdClose } from "react-icons/md";

import {
  useGetLeagueQuery,
  useGetLeagueMembersQuery,
  useGetLeagueMatchesQuery,
  useConfirmMatchMutation,
  useDisputeMatchMutation,
} from "@/api/baseApi";
import { useAppSelector } from "@/app/hooks";

export const MatchHistoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const user = useAppSelector((state) => state.auth.user);

  const { data: league } = useGetLeagueQuery(id!, { skip: !id });
  const { data: members = [], isLoading: membersLoading } = useGetLeagueMembersQuery(id!, { skip: !id });
  const { data: matches = [], isLoading: matchesLoading } = useGetLeagueMatchesQuery(id!, { skip: !id });

  const [confirmMatch] = useConfirmMatchMutation();
  const [disputeMatch] = useDisputeMatchMutation();

  const loading = membersLoading || matchesLoading;

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

  const handleConfirm = (matchId: string) => confirmMatch({ matchId, leagueId: id! });
  const handleDispute = (matchId: string) => disputeMatch({ matchId, leagueId: id! });

  const groupedMatches = useMemo(() => {
    const sorted = [...matches].sort((a, b) => b.created_at.localeCompare(a.created_at));
    const groups = new Map<string, typeof matches>();
    for (const m of sorted) {
      const dateKey = m.created_at.slice(0, 10);
      const group = groups.get(dateKey);
      if (group) group.push(m);
      else groups.set(dateKey, [m]);
    }
    return [...groups.entries()];
  }, [matches]);

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
        <div className="space-y-6">
          {groupedMatches.map(([dateKey, dayMatches]) => (
            <div key={dateKey}>
              <h3 className="mb-2 text-sm font-semibold text-text-secondary">
                {new Date(dateKey + "T00:00:00").toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
              <div className="overflow-x-auto rounded-xl border border-border bg-bg-secondary shadow-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left text-sm text-text-secondary">
                      <th className="px-4 py-3">Team 1</th>
                      <th className="px-4 py-3 text-center">Score</th>
                      <th className="px-4 py-3">Team 2</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayMatches.map((m) => {
                      const isTeam1Winner = m.team1_score > m.team2_score;
                      const canAct = isAdmin || (
                        user?.player_id !== m.submitted_by && (
                          m.team1_player_ids.includes(user?.player_id ?? "") ||
                          m.team2_player_ids.includes(user?.player_id ?? "")
                        )
                      );
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
                            {m.status === "PENDING" && canAct ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleConfirm(m.match_id)}
                                  className="rounded-full bg-success/10 p-2 text-success transition-colors hover:bg-success/20"
                                  title="Confirm"
                                >
                                  <MdCheck size={16} />
                                </button>
                                <button
                                  onClick={() => handleDispute(m.match_id)}
                                  className="rounded-full bg-danger/10 p-2 text-danger transition-colors hover:bg-danger/20"
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
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
