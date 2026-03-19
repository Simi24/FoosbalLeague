import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { getIdToken } from "@/features/auth/tokenStorage";
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
} from "@/projects/league/types";

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "/api/v1";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = getIdToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
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
  // Rankings
  useGetLeaderboardQuery,
  useGetEloHistoryQuery,
  // Players
  useGetPlayersQuery,
  useGetPlayerQuery,
  useUpdateMeMutation,
  // Achievements
  useGetAchievementsQuery,
  // Auth
  useRegisterPlayerMutation,
} = api;
