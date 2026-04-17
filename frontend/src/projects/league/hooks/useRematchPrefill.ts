import { useMemo } from "react";
import type { Match } from "../types";

export interface RematchInfo {
  lastMatch: Match;
  team1: (string | null)[];
  team2: (string | null)[];
  hasMissing: boolean;
}

interface Args {
  currentPlayerId: string | null;
  matches: Match[];
  memberIds: ReadonlySet<string>;
}

export const useRematchPrefill = ({
  currentPlayerId,
  matches,
  memberIds,
}: Args): RematchInfo | null => {
  return useMemo(() => {
    if (!currentPlayerId) return null;

    const participating = matches.filter(
      (m) =>
        m.team1_player_ids.includes(currentPlayerId) ||
        m.team2_player_ids.includes(currentPlayerId),
    );
    if (participating.length === 0) return null;

    const last = participating.reduce((a, b) =>
      a.created_at >= b.created_at ? a : b,
    );

    const mapIds = (ids: string[]) =>
      ids.map((id) => (memberIds.has(id) ? id : null));
    const team1 = mapIds(last.team1_player_ids);
    const team2 = mapIds(last.team2_player_ids);

    return {
      lastMatch: last,
      team1,
      team2,
      hasMissing: team1.includes(null) || team2.includes(null),
    };
  }, [currentPlayerId, matches, memberIds]);
};
