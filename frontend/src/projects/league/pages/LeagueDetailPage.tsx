import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MdAdd, MdCheck, MdClose, MdHistory, MdLeaderboard, MdLogout, MdSettings } from "react-icons/md";

import {
  useGetLeagueQuery,
  useGetLeagueMembersQuery,
  useGetLeagueMatchesQuery,
  useConfirmMatchMutation,
  useDisputeMatchMutation,
  useLeaveLeagueMutation,
} from "@/api/baseApi";
import { useAppSelector } from "@/app/hooks";
import { Avatar } from "@/components/Avatar";

const STATUS_FILL: Record<string, string> = {
  CONFIRMED: "bg-mint",
  DISPUTED: "bg-coral",
  PENDING: "bg-butter",
};

export const LeagueDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const { data: league, isLoading: leagueLoading } = useGetLeagueQuery(id!, { skip: !id });
  const { data: members = [], isLoading: membersLoading } = useGetLeagueMembersQuery(id!, { skip: !id });
  const { data: matches = [], isLoading: matchesLoading } = useGetLeagueMatchesQuery(id!, { skip: !id });

  const [confirmMatch] = useConfirmMatchMutation();
  const [disputeMatch] = useDisputeMatchMutation();
  const [leaveLeague] = useLeaveLeagueMutation();

  const loading = leagueLoading || membersLoading || matchesLoading;

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

  const handleConfirm = (matchId: string) => {
    confirmMatch({ matchId, leagueId: id! });
  };

  const handleDispute = (matchId: string) => {
    disputeMatch({ matchId, leagueId: id! });
  };

  const recentMatches = useMemo(
    () => [...matches].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 10),
    [matches],
  );

  const handleLeave = async () => {
    await leaveLeague(id!).unwrap();
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin border-[3px] border-ink border-t-transparent" />
      </div>
    );
  }
  if (!league) return <p className="font-semibold text-danger">League not found</p>;

  return (
    <div>
      <div className="brut-border brut-shadow mb-6 bg-peach p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
              {league.name}
            </h1>
            <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-ink-soft">
              {league.league_type} · {league.member_count} members · {league.match_count} matches
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {currentMember && !isAdmin && (
              <button
                onClick={handleLeave}
                className="brut-border btn-press flex min-h-[44px] items-center justify-center gap-2 bg-coral px-3 py-2 text-sm font-bold text-ink transition-colors"
              >
                <MdLogout size={16} /> Leave
              </button>
            )}
            {isAdmin && (
              <Link
                to={`/leagues/${id}/settings`}
                aria-label="League settings"
                className="brut-border btn-press flex min-h-[44px] items-center justify-center gap-2 bg-card px-3 py-2 text-sm font-bold text-ink transition-colors hover:bg-paper-alt"
              >
                <MdSettings size={18} />
              </Link>
            )}
            <Link
              to={`/leagues/${id}/leaderboard`}
              className="brut-border btn-press flex min-h-[44px] items-center justify-center gap-2 bg-card px-3 py-2 text-sm font-bold text-ink transition-colors hover:bg-paper-alt"
            >
              <MdLeaderboard size={16} /> Leaderboard
            </Link>
            <Link
              to={`/leagues/${id}/match/new`}
              className="brut-border btn-press brut-shadow flex min-h-[44px] items-center justify-center gap-2 bg-ink px-3 py-2 text-sm font-bold uppercase tracking-wide text-paper transition-colors"
            >
              <MdAdd size={18} /> Record Match
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="brut-border brut-shadow bg-card p-5">
          <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-ink">
            Members
          </h2>
          {members.length === 0 ? (
            <p className="text-sm font-medium text-ink-muted">No members yet.</p>
          ) : (
            <ul className="divide-y-2 divide-ink/10">
              {members.map((m) => (
                <li key={m.player_id}>
                  <Link
                    to={`/players/${m.player_id}`}
                    className="flex items-center justify-between py-2 transition-colors hover:bg-paper-alt"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar name={m.display_name} size="sm" />
                      <span className="text-sm font-semibold text-ink">
                        {m.display_name}
                        {m.role === "admin" && (
                          <span className="ml-2 border-2 border-ink bg-butter px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink">
                            admin
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="font-mono text-sm font-bold text-team-blue">
                      {m.current_elo}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="brut-border brut-shadow bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold uppercase tracking-wide text-ink">
              Recent Matches
            </h2>
            {matches.length > 5 && (
              <Link
                to={`/leagues/${id}/matches`}
                className="btn-press flex items-center gap-1 border-b-2 border-ink pb-0.5 text-xs font-bold uppercase tracking-wide text-ink"
              >
                <MdHistory size={14} /> View all
              </Link>
            )}
          </div>
          {matches.length === 0 ? (
            <p className="text-sm font-medium text-ink-muted">No matches yet.</p>
          ) : (
            <ul className="divide-y-2 divide-ink/10">
              {recentMatches.map((m) => {
                const canAct =
                  m.status === "PENDING" &&
                  (isAdmin ||
                    (user?.player_id !== m.submitted_by &&
                      (m.team1_player_ids.includes(user?.player_id ?? "") ||
                        m.team2_player_ids.includes(user?.player_id ?? ""))));
                return (
                  <li
                    key={m.match_id}
                    className="flex min-w-0 items-center justify-between gap-2 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <span className="block truncate font-medium text-ink">
                        {m.team1_player_ids.map(resolveName).join(", ")} vs{" "}
                        {m.team2_player_ids.map(resolveName).join(", ")}
                      </span>
                      <span className="font-mono text-xs text-ink-muted">
                        {new Date(m.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-mono font-bold text-ink">
                        {m.team1_score}&ndash;{m.team2_score}
                      </span>
                      {canAct ? (
                        <div className="flex items-center gap-1">
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
                          className={`border-2 border-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink ${
                            STATUS_FILL[m.status] ?? "bg-paper-alt"
                          }`}
                        >
                          {m.status}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
