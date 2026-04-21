import { useMemo } from "react";
import { MdCheck, MdClose } from "react-icons/md";

import {
  useConfirmMatchMutation,
  useDisputeMatchMutation,
  useGetLeagueMatchesQuery,
  useGetLeagueMembersQuery,
} from "@/api/baseApi";
import { useAppSelector } from "@/app/hooks";
import type { MyLeague } from "../types";

type Props = {
  league: MyLeague;
};

export const PendingLeagueGroup = ({ league }: Props) => {
  const userId = useAppSelector((state) => state.auth.user?.player_id ?? null);
  const { data: matches = [] } = useGetLeagueMatchesQuery(league.league_id);
  const { data: members = [] } = useGetLeagueMembersQuery(league.league_id);

  const [confirmMatch] = useConfirmMatchMutation();
  const [disputeMatch] = useDisputeMatchMutation();

  const names = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of members) map[m.player_id] = m.display_name;
    return map;
  }, [members]);

  const isAdmin = league.role === "admin";

  const actionable = useMemo(
    () =>
      matches.filter(
        (m) =>
          m.status === "PENDING" &&
          (isAdmin ||
            (userId !== null &&
              userId !== m.submitted_by &&
              (m.team1_player_ids.includes(userId) ||
                m.team2_player_ids.includes(userId)))),
      ),
    [matches, isAdmin, userId],
  );

  if (actionable.length === 0) return null;

  return (
    <div className="brut-border brut-shadow bg-card">
      <header className="flex items-center justify-between border-b-2 border-ink bg-butter px-3 py-2">
        <span className="text-xs font-bold uppercase tracking-wider text-ink">
          {league.name}
        </span>
        <span className="border-2 border-ink bg-card px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink">
          {actionable.length}
        </span>
      </header>
      <ul className="divide-y-2 divide-ink/10">
        {actionable.map((m) => {
          const t1 = m.team1_player_ids.map((id) => names[id] ?? id).join(", ");
          const t2 = m.team2_player_ids.map((id) => names[id] ?? id).join(", ");
          return (
            <li
              key={m.match_id}
              className="flex min-w-0 flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">
                  {t1} <span className="text-ink-muted">vs</span> {t2}
                </p>
                <p className="mt-0.5 font-mono text-xs font-semibold text-ink-soft">
                  {m.team1_score}–{m.team2_score} ·{" "}
                  {new Date(m.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    confirmMatch({ matchId: m.match_id, leagueId: league.league_id })
                  }
                  className="brut-border btn-press flex min-h-[40px] items-center gap-1 bg-mint px-3 py-1.5 text-sm font-bold text-ink"
                >
                  <MdCheck size={16} />
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() =>
                    disputeMatch({ matchId: m.match_id, leagueId: league.league_id })
                  }
                  className="brut-border btn-press flex min-h-[40px] items-center gap-1 bg-coral px-3 py-1.5 text-sm font-bold text-ink"
                >
                  <MdClose size={16} />
                  Dispute
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
