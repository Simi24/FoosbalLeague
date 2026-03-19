export type Tag =
  | "MyLeagues"
  | "League"
  | "Members"
  | "Matches"
  | "Leaderboard"
  | "Players"
  | "PlayerProfile"
  | "EloHistory"
  | "Achievements";

const TAG_EFFECTS: Partial<Record<Tag, Tag[]>> = {
  Matches: ["Leaderboard", "EloHistory", "Achievements"],
  Leaderboard: ["Members"],
  Members: ["League"],
  League: ["MyLeagues"],
};

export const withEffects = (seeds: Tag[]): Tag[] => {
  const result = new Set<Tag>(seeds);
  const queue = [...seeds];
  while (queue.length > 0) {
    const tag = queue.pop()!;
    for (const downstream of TAG_EFFECTS[tag] ?? []) {
      if (!result.has(downstream)) {
        result.add(downstream);
        queue.push(downstream);
      }
    }
  }
  return [...result];
};

const LEAGUE_SCOPED: Set<Tag> = new Set([
  "League",
  "Members",
  "Matches",
  "Leaderboard",
]);

export const withScopedEffects = (
  leagueId: string,
  seeds: Tag[],
): Array<{ type: Tag; id: string } | Tag> => {
  const expanded = withEffects(seeds);
  return expanded.map((tag) =>
    LEAGUE_SCOPED.has(tag) ? { type: tag, id: leagueId } : tag,
  );
};
