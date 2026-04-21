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

const STATUS_FILL: Record<string, string> = {
  CONFIRMED: "bg-mint",
  DISPUTED: "bg-coral",
  PENDING: "bg-butter",
};

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
        <div className="h-8 w-8 animate-spin border-[3px] border-ink border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link
          to={`/leagues/${id}`}
          aria-label="Back"
          className="brut-border btn-press bg-card p-2 text-ink transition-colors hover:bg-paper-alt"
        >
          <MdArrowBack size={18} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
            Match History
          </h1>
          {league && (
            <p className="font-mono text-xs font-semibold uppercase tracking-wide text-ink-soft">
              {league.name} · {matches.length} matches
            </p>
          )}
        </div>
      </div>

      {matches.length === 0 ? (
        <p className="text-sm font-medium text-ink-muted">No matches yet.</p>
      ) : (
        <div className="space-y-6">
          {groupedMatches.map(([dateKey, dayMatches]) => (
            <div key={dateKey}>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-soft">
                {new Date(dateKey + "T00:00:00").toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
              <div className="brut-border brut-shadow overflow-x-auto bg-card">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b-2 border-ink bg-paper-alt text-left text-xs font-bold uppercase tracking-wider text-ink">
                      <th className="px-3 py-2">Team 1</th>
                      <th className="px-3 py-2 text-center">Score</th>
                      <th className="px-3 py-2">Team 2</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayMatches.map((m) => {
                      const isTeam1Winner = m.team1_score > m.team2_score;
                      const canAct =
                        m.status === "PENDING" &&
                        (isAdmin ||
                          (user?.player_id !== m.submitted_by &&
                            (m.team1_player_ids.includes(user?.player_id ?? "") ||
                              m.team2_player_ids.includes(user?.player_id ?? ""))));
                      return (
                        <tr
                          key={m.match_id}
                          className="border-b-2 border-ink/10 last:border-b-0 transition-colors hover:bg-paper-alt"
                        >
                          <td
                            className={`px-3 py-3 text-sm ${
                              isTeam1Winner && m.status === "CONFIRMED"
                                ? "bg-team-blue-tint font-bold text-ink"
                                : "font-medium text-ink-soft"
                            }`}
                          >
                            {m.team1_player_ids.map(resolveName).join(", ")}
                          </td>
                          <td className="px-3 py-3 text-center font-mono text-sm font-bold text-ink">
                            {m.team1_score}&ndash;{m.team2_score}
                          </td>
                          <td
                            className={`px-3 py-3 text-sm ${
                              !isTeam1Winner && m.status === "CONFIRMED"
                                ? "bg-team-red-tint font-bold text-ink"
                                : "font-medium text-ink-soft"
                            }`}
                          >
                            {m.team2_player_ids.map(resolveName).join(", ")}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {canAct ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleConfirm(m.match_id)}
                                  className="brut-border btn-press bg-mint p-1.5 text-ink"
                                  title="Confirm"
                                >
                                  <MdCheck size={16} />
                                </button>
                                <button
                                  onClick={() => handleDispute(m.match_id)}
                                  className="brut-border btn-press bg-coral p-1.5 text-ink"
                                  title="Dispute"
                                >
                                  <MdClose size={16} />
                                </button>
                              </div>
                            ) : (
                              <span
                                className={`inline-block border-2 border-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink ${
                                  STATUS_FILL[m.status] ?? "bg-paper-alt"
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
