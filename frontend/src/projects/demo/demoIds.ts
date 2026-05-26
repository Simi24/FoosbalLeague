export const DEMO_TENANT_ID = "demo-tenant";

export const DEMO_LEAGUE_1V1_ID = "demo-1v1";
export const DEMO_LEAGUE_2V2_ID = "demo-2v2";

export const DEMO_USER_PLAYER_ID = "demo-p-you";
export const DEMO_USER_SUB = "demo-sub-you";

export const isDemoLeagueId = (id: string): boolean =>
  id === DEMO_LEAGUE_1V1_ID || id === DEMO_LEAGUE_2V2_ID;

export const isDemoPlayerId = (id: string): boolean => id.startsWith("demo-p");
