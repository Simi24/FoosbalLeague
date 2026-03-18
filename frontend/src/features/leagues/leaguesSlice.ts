import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import { apiFetch } from "@/api";
import { logout } from "@/features/auth";
import type { MyLeague } from "@/projects/league/types";

const CACHE_TTL_MS = 5 * 60 * 1000;

type LeaguesState = {
  data: MyLeague[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  lastFetchedAt: number | null;
};

const initialState: LeaguesState = {
  data: [],
  status: "idle",
  error: null,
  lastFetchedAt: null,
};

export const fetchMyLeagues = createAsyncThunk(
  "leagues/fetchMyLeagues",
  async () => {
    const res = await apiFetch("/leagues/my");
    if (!res.ok) return [] as MyLeague[];
    return (await res.json()) as MyLeague[];
  },
  {
    condition: (_, { getState }) => {
      const { leagues } = getState() as { leagues: LeaguesState };
      if (leagues.status === "loading") return false;
      if (
        leagues.lastFetchedAt &&
        Date.now() - leagues.lastFetchedAt < CACHE_TTL_MS
      )
        return false;
      return true;
    },
  },
);

export const leaguesSlice = createSlice({
  name: "leagues",
  initialState,
  reducers: {
    invalidateLeagues: (state) => {
      state.lastFetchedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyLeagues.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMyLeagues.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
        state.lastFetchedAt = Date.now();
        state.error = null;
      })
      .addCase(fetchMyLeagues.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to fetch leagues";
      })
      .addCase(logout, () => initialState);
  },
});

export const { invalidateLeagues } = leaguesSlice.actions;
