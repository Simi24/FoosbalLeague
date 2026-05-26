import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

import { ensureFreshToken } from "@/features/auth/refreshGate";
import { getIdToken } from "@/features/auth/tokenStorage";
import { handleDemoQuery } from "@/projects/demo/demoQueryHandler";
import { selectIsDemoMode } from "@/projects/demo/demoSlice";
import { withScopedEffects } from "./tagHelpers";
import type {
  Achievement,
  EloHistoryPoint,
  League,
  LeagueMember,
  Leaderboard,
  Match,
  MyLeague,
  Player,
  PlayerInsights,
} from "@/projects/league/types";

export type NotificationType =
  | "MATCH_PENDING"
  | "MATCH_CONFIRMED"
  | "MATCH_DISPUTED"
  | "MATCH_DELETED"
  | "ACHIEVEMENT_UNLOCKED";

export interface NotificationItem {
  notif_id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  unread_count: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "/api/v1";

const realBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = getIdToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

// Demo intercept: when `state.demo.isDemoMode` is true, every RTK Query call is
// served from the in-memory demo slice instead of hitting the network. See
// `projects/demo/demoQueryHandler.ts`.
const dynamicBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const state = api.getState() as { demo: Parameters<typeof selectIsDemoMode>[0]["demo"] };
  if (selectIsDemoMode(state)) {
    const result = handleDemoQuery(
      args,
      state as never,
      api.dispatch as never,
    );
    if (result.error) {
      return { error: result.error as FetchBaseQueryError };
    }
    return { data: result.data };
  }

  await ensureFreshToken();
  let result = await realBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshed = await ensureFreshToken({ force: true });
    if (refreshed) {
      result = await realBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: dynamicBaseQuery,
  tagTypes: [
    "MyLeagues",
    "League",
    "Members",
    "Matches",
    "Leaderboard",
    "Players",
    "PlayerProfile",
    "EloHistory",
    "Achievements",
    "PlayerInsights",
    "Notifications",
  ],
  endpoints: (build) => ({
    // ─── Leagues ───────────────────────────────────────────
    getMyLeagues: build.query<MyLeague[], void>({
      query: () => "/leagues/my",
      providesTags: ["MyLeagues"],
    }),
    getLeague: build.query<League, string>({
      query: (id) => `/leagues/${id}`,
      providesTags: (_, __, id) => [{ type: "League", id }],
    }),
    createLeague: build.mutation<League, { name: string; league_type: string; description: string }>({
      query: (body) => ({ url: "/leagues/", method: "POST", body }),
      invalidatesTags: ["MyLeagues"],
    }),
    updateLeague: build.mutation<void, { id: string; name: string; description: string }>({
      query: ({ id, ...body }) => ({ url: `/leagues/${id}`, method: "PATCH", body }),
      invalidatesTags: (_, __, { id }) => ["MyLeagues", { type: "League", id }],
    }),
    deleteLeague: build.mutation<void, string>({
      query: (id) => ({ url: `/leagues/${id}`, method: "DELETE" }),
      invalidatesTags: ["MyLeagues"],
    }),
    joinLeague: build.mutation<void, { code: string }>({
      query: (body) => ({ url: "/leagues/join", method: "POST", body }),
      invalidatesTags: ["MyLeagues"],
    }),
    leaveLeague: build.mutation<void, string>({
      query: (id) => ({ url: `/leagues/${id}/leave`, method: "POST" }),
      invalidatesTags: ["MyLeagues"],
    }),
    regenerateCode: build.mutation<{ invite_code: string }, string>({
      query: (id) => ({ url: `/leagues/${id}/regenerate-code`, method: "POST" }),
      invalidatesTags: (_, __, id) => ["MyLeagues", { type: "League", id }],
    }),

    // ─── Members ───────────────────────────────────────────
    getLeagueMembers: build.query<LeagueMember[], string>({
      query: (id) => `/leagues/${id}/members`,
      providesTags: (_, __, id) => [{ type: "Members", id }],
    }),
    kickMember: build.mutation<void, { leagueId: string; playerId: string }>({
      query: ({ leagueId, playerId }) => ({
        url: `/leagues/${leagueId}/kick/${playerId}`,
        method: "POST",
      }),
      invalidatesTags: (_, __, { leagueId }) =>
        withScopedEffects(leagueId, ["Members"]),
    }),
    promoteMember: build.mutation<void, { leagueId: string; playerId: string }>({
      query: ({ leagueId, playerId }) => ({
        url: `/leagues/${leagueId}/promote/${playerId}`,
        method: "POST",
      }),
      invalidatesTags: (_, __, { leagueId }) =>
        withScopedEffects(leagueId, ["Members"]),
    }),
    demoteMember: build.mutation<void, { leagueId: string; playerId: string }>({
      query: ({ leagueId, playerId }) => ({
        url: `/leagues/${leagueId}/demote/${playerId}`,
        method: "POST",
      }),
      invalidatesTags: (_, __, { leagueId }) =>
        withScopedEffects(leagueId, ["Members"]),
    }),

    // ─── Matches ───────────────────────────────────────────
    getLeagueMatches: build.query<Match[], string>({
      query: (id) => `/matches/league/${id}`,
      providesTags: (_, __, id) => [{ type: "Matches", id }],
    }),
    recordMatch: build.mutation<
      void,
      {
        league_id: string;
        team1: { player_ids: string[]; score: number };
        team2: { player_ids: string[]; score: number };
      }
    >({
      query: (body) => ({ url: "/matches/", method: "POST", body }),
      invalidatesTags: (_, __, { league_id }) =>
        withScopedEffects(league_id, ["Matches"]),
    }),
    confirmMatch: build.mutation<void, { matchId: string; leagueId: string }>({
      query: ({ matchId }) => ({ url: `/matches/${matchId}/confirm`, method: "POST" }),
      invalidatesTags: (_, __, { leagueId }) =>
        withScopedEffects(leagueId, ["Matches"]),
    }),
    disputeMatch: build.mutation<void, { matchId: string; leagueId: string }>({
      query: ({ matchId }) => ({ url: `/matches/${matchId}/dispute`, method: "POST" }),
      invalidatesTags: (_, __, { leagueId }) =>
        withScopedEffects(leagueId, ["Matches"]),
    }),
    deleteMatch: build.mutation<
      void,
      { matchId: string; leagueId: string; reason?: string }
    >({
      query: ({ matchId, reason }) => ({
        url: `/matches/${matchId}`,
        method: "DELETE",
        body: reason ? { reason } : undefined,
      }),
      invalidatesTags: (_, __, { leagueId }) =>
        withScopedEffects(leagueId, ["Matches"]),
    }),

    // ─── Rankings ──────────────────────────────────────────
    getLeaderboard: build.query<Leaderboard, string>({
      query: (id) => `/rankings/league/${id}`,
      providesTags: (_, __, id) => [{ type: "Leaderboard", id }],
    }),
    getEloHistory: build.query<EloHistoryPoint[], { playerId: string; leagueId: string }>({
      query: ({ playerId, leagueId }) =>
        `/rankings/player/${playerId}/history?league_id=${leagueId}`,
      transformResponse: (response: { history: EloHistoryPoint[] }) => response.history,
      providesTags: (_, __, { playerId, leagueId }) => [
        { type: "EloHistory", id: `${playerId}-${leagueId}` },
      ],
    }),

    // ─── Players ───────────────────────────────────────────
    getPlayers: build.query<Player[], void>({
      query: () => "/players/",
      providesTags: ["Players"],
    }),
    getPlayer: build.query<Player, string>({
      query: (id) => `/players/${id}`,
      providesTags: (_, __, id) => [{ type: "PlayerProfile", id }],
    }),
    updateMe: build.mutation<void, { display_name: string }>({
      query: (body) => ({ url: "/players/me", method: "PATCH", body }),
      invalidatesTags: ["Players"],
    }),

    // ─── Achievements ──────────────────────────────────────
    getAchievements: build.query<Achievement[], { playerId: string; leagueId: string }>({
      query: ({ playerId, leagueId }) =>
        `/achievements/player/${playerId}?league_id=${leagueId}`,
      transformResponse: (response: { achievements: Achievement[] }) => response.achievements,
      providesTags: (_, __, { playerId, leagueId }) => [
        { type: "Achievements", id: `${playerId}-${leagueId}` },
      ],
    }),

    // ─── Player insights ───────────────────────────────────
    getPlayerInsights: build.query<
      PlayerInsights,
      { playerId: string; leagueId: string }
    >({
      query: ({ playerId, leagueId }) =>
        `/players/${playerId}/insights?league_id=${leagueId}`,
      providesTags: (_, __, { playerId, leagueId }) => [
        { type: "PlayerInsights", id: `${playerId}-${leagueId}` },
      ],
    }),

    // ─── Notifications ─────────────────────────────────────
    getNotifications: build.query<NotificationListResponse, void>({
      query: () => "/notifications",
      providesTags: ["Notifications"],
    }),
    markNotificationRead: build.mutation<void, string>({
      query: (notifId) => ({
        url: `/notifications/${notifId}/read`,
        method: "POST",
      }),
      invalidatesTags: ["Notifications"],
    }),
    markAllNotificationsRead: build.mutation<void, void>({
      query: () => ({ url: "/notifications/read-all", method: "POST" }),
      invalidatesTags: ["Notifications"],
    }),

    // ─── Auth ──────────────────────────────────────────────
    registerPlayer: build.mutation<void, { display_name: string }>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
    }),
  }),
});

export const {
  // Leagues
  useGetMyLeaguesQuery,
  useGetLeagueQuery,
  useCreateLeagueMutation,
  useUpdateLeagueMutation,
  useDeleteLeagueMutation,
  useJoinLeagueMutation,
  useLeaveLeagueMutation,
  useRegenerateCodeMutation,
  // Members
  useGetLeagueMembersQuery,
  useKickMemberMutation,
  usePromoteMemberMutation,
  useDemoteMemberMutation,
  // Matches
  useGetLeagueMatchesQuery,
  useRecordMatchMutation,
  useConfirmMatchMutation,
  useDisputeMatchMutation,
  useDeleteMatchMutation,
  // Rankings
  useGetLeaderboardQuery,
  useGetEloHistoryQuery,
  // Players
  useGetPlayersQuery,
  useGetPlayerQuery,
  useUpdateMeMutation,
  // Achievements
  useGetAchievementsQuery,
  // Player insights
  useGetPlayerInsightsQuery,
  // Notifications
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  // Auth
  useRegisterPlayerMutation,
} = api;
