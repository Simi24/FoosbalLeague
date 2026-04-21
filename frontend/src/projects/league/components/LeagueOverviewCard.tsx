import { useMemo } from "react";
import { Link } from "react-router-dom";
import { MdChevronRight, MdPeople, MdSportsSoccer } from "react-icons/md";

import { useGetLeagueMatchesQuery } from "@/api/baseApi";
import { useAppSelector } from "@/app/hooks";
import type { MyLeague } from "../types";

type Props = {
  league: MyLeague;
  tint: string;
  animationDelay?: number;
};

export const LeagueOverviewCard = ({ league, tint, animationDelay = 0 }: Props) => {
  const userId = useAppSelector((state) => state.auth.user?.player_id ?? null);
  const { data: matches = [] } = useGetLeagueMatchesQuery(league.league_id);

  const lastMatch = useMemo(() => {
    if (!userId) return null;
    const mine = matches
      .filter(
        (m) =>
          m.status === "CONFIRMED" &&
          (m.team1_player_ids.includes(userId) ||
            m.team2_player_ids.includes(userId)),
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return mine[0] ?? null;
  }, [matches, userId]);

  const lastResult = useMemo(() => {
    if (!lastMatch || !userId) return null;
    const onTeam1 = lastMatch.team1_player_ids.includes(userId);
    const mine = onTeam1 ? lastMatch.team1_score : lastMatch.team2_score;
    const theirs = onTeam1 ? lastMatch.team2_score : lastMatch.team1_score;
    return { won: mine > theirs, mine, theirs };
  }, [lastMatch, userId]);

  return (
    <Link
      to={`/leagues/${league.league_id}`}
      className="card-interactive animate-in brut-border brut-shadow block bg-card"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className={`flex items-center justify-between border-b-2 border-ink px-4 py-2 ${tint}`}>
        <span className="truncate text-base font-bold text-ink">{league.name}</span>
        <span className="border-2 border-ink bg-card px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink">
          {league.league_type}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
              Your ELO
            </p>
            <p className="font-mono text-3xl font-bold text-team-blue">
              {league.current_elo}
            </p>
          </div>
          {lastResult && (
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                Last match
              </p>
              <p className="font-mono text-sm font-bold">
                <span className={lastResult.won ? "text-success" : "text-danger"}>
                  {lastResult.won ? "W" : "L"}
                </span>{" "}
                <span className="text-ink">
                  {lastResult.mine}–{lastResult.theirs}
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t-2 border-ink/10 pt-3 text-xs font-medium text-ink-soft">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <MdPeople size={14} /> {league.member_count}
            </span>
            <span className="flex items-center gap-1">
              <MdSportsSoccer size={14} /> {league.match_count}
            </span>
          </div>
          <span className="flex items-center gap-0.5 font-bold uppercase tracking-wide text-ink">
            Open <MdChevronRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
};
