export type PlayerInput = {
  id: string;
  elo: number;
  matchesPlayed: number;
};

const getKFactor = (gamesPlayed: number): number => {
  if (gamesPlayed <= 10) return 40;
  if (gamesPlayed <= 30) return 32;
  return 24;
};

const expectedScore = (teamAvg: number, opponentAvg: number): number =>
  1.0 / (1.0 + Math.pow(10.0, (opponentAvg - teamAvg) / 400.0));

export const calculateEloPreview = (
  team1: PlayerInput[],
  team2: PlayerInput[],
  team1Won: boolean | null,
): Map<string, number> => {
  if (team1.length === 0 || team2.length === 0 || team1Won === null)
    return new Map();

  const team1Avg = team1.reduce((s, p) => s + p.elo, 0) / team1.length;
  const team2Avg = team2.reduce((s, p) => s + p.elo, 0) / team2.length;

  const team1Actual = team1Won ? 1.0 : 0.0;
  const team2Actual = team1Won ? 0.0 : 1.0;

  const team1Expected = expectedScore(team1Avg, team2Avg);
  const team2Expected = expectedScore(team2Avg, team1Avg);

  const changes = new Map<string, number>();
  for (const p of team1) {
    changes.set(p.id, Math.round(getKFactor(p.matchesPlayed) * (team1Actual - team1Expected)));
  }
  for (const p of team2) {
    changes.set(p.id, Math.round(getKFactor(p.matchesPlayed) * (team2Actual - team2Expected)));
  }
  return changes;
};
