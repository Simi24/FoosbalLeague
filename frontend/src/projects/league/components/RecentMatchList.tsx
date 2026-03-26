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
    <div className="mb-6 rounded-xl border border-border bg-bg-secondary p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-text-primary">
        Recent Matches
      </h2>

      <div className="space-y-1">
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

          return (
            <div
              key={m.match_id}
              className="flex min-w-0 items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm hover:bg-bg-tertiary"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    m.status === "CONFIRMED"
                      ? won
                        ? "bg-success/10 text-success"
                        : "bg-danger/10 text-danger"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {m.status === "CONFIRMED" ? (won ? "W" : "L") : m.status.charAt(0)}
                </span>
                <span className="truncate text-text-primary">
                  vs {opponentNames}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="font-mono font-semibold text-accent">
                  {playerScore} &ndash; {opponentScore}
                </span>
                <span
                  className={`w-10 text-right text-xs font-medium ${
                    delta === undefined
                      ? "text-text-muted"
                      : delta >= 0
                        ? "text-success"
                        : "text-danger"
                  }`}
                >
                  {delta === undefined ? "--" : `${delta >= 0 ? "+" : ""}${delta}`}
                </span>
                <span className="w-16 text-right text-xs text-text-muted">
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
          className="mt-3 flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover"
        >
          {expanded ? (
            <>
              <MdExpandLess size={14} /> Show less
            </>
          ) : (
            <>
              <MdExpandMore size={14} /> Show all {matches.length} matches
            </>
          )}
        </button>
      )}
    </div>
  );
};
