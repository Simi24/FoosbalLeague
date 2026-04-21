import { useState } from "react";
import { MdExpandMore, MdExpandLess } from "react-icons/md";

import type { Match } from "../types";

type RecentMatchListProps = {
  matches: Match[];
  playerId: string;
  playerNames: Record<string, string>;
};

const INITIAL_COUNT = 5;

export const RecentMatchList = ({ matches, playerId, playerNames }: RecentMatchListProps) => {
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? matches : matches.slice(0, INITIAL_COUNT);

  return (
    <div className="brut-border brut-shadow mb-6 bg-card p-5">
      <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-ink">
        Recent Matches
      </h2>

      <div className="divide-y-2 divide-ink/10">
        {visible.map((m) => {
          const isTeam1 = m.team1_player_ids.includes(playerId);
          const playerScore = isTeam1 ? m.team1_score : m.team2_score;
          const opponentScore = isTeam1 ? m.team2_score : m.team1_score;
          const opponentIds = isTeam1 ? m.team2_player_ids : m.team1_player_ids;
          const won = playerScore > opponentScore;

          const eloChange = m.elo_changes.find((e) => e.player_id === playerId);
          const delta = eloChange?.delta;

          const opponentNames = opponentIds
            .map((id) => playerNames[id] ?? id)
            .join(", ");

          const chipFill =
            m.status === "CONFIRMED"
              ? won
                ? "bg-mint"
                : "bg-coral"
              : "bg-butter";

          return (
            <div
              key={m.match_id}
              className="flex min-w-0 items-center justify-between gap-2 px-1 py-2 text-sm transition-colors hover:bg-paper-alt"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center border-2 border-ink text-xs font-bold text-ink ${chipFill}`}
                >
                  {m.status === "CONFIRMED" ? (won ? "W" : "L") : m.status.charAt(0)}
                </span>
                <span className="truncate font-medium text-ink">
                  vs {opponentNames}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="font-mono font-bold text-ink">
                  {playerScore}&ndash;{opponentScore}
                </span>
                <span
                  className={`w-10 text-right font-mono text-xs font-bold ${
                    delta === undefined
                      ? "text-ink-muted"
                      : delta >= 0
                        ? "text-success"
                        : "text-danger"
                  }`}
                >
                  {delta === undefined ? "--" : `${delta >= 0 ? "+" : ""}${delta}`}
                </span>
                <span className="hidden w-16 text-right font-mono text-xs text-ink-muted sm:block">
                  {new Date(m.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {matches.length > INITIAL_COUNT && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="btn-press mt-3 flex items-center gap-1 border-b-2 border-ink pb-0.5 text-xs font-bold uppercase tracking-wide text-ink hover:text-ink-soft"
        >
          {expanded ? (
            <>
              <MdExpandLess size={14} /> Show less
            </>
          ) : (
            <>
              <MdExpandMore size={14} /> Show all {matches.length}
            </>
          )}
        </button>
      )}
    </div>
  );
};
