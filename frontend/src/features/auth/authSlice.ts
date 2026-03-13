import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import { apiFetch } from "@/api";
import { isLocalMode, exchangeCodeForTokens, buildLogoutUrl } from "./cognito";
import { saveTokens, getIdToken, clearTokens, isTokenExpired } from "./tokenStorage";

type UserInfo = {
  sub: string;
  email: string;
  name: string;
  groups: string[];
  tenant_id: string;
};

type AuthState = {
  user: UserInfo | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  isAuthenticated: boolean;
};

const initialState: AuthState = {
  user: null,
  status: "idle",
  error: null,
  isAuthenticated: false,
};

const fetchMe = async (): Promise<UserInfo> => {
  const response = await apiFetch("/auth/me");
  if (!response.ok) throw new Error("Not authenticated");
  return (await response.json()) as UserInfo;
};

export const initAuth = createAsyncThunk(
  "auth/initAuth",
  async () => {
    if (isLocalMode()) {
      return fetchMe();
    }

    const token = getIdToken();
    if (!token || isTokenExpired(token)) {
      clearTokens();
      throw new Error("No valid token");
    }

    return fetchMe();
  },
);

export const handleCallback = createAsyncThunk(
  "auth/handleCallback",
  async (code: string) => {
    const tokens = await exchangeCodeForTokens(code);
    saveTokens(tokens);
    return fetchMe();
  },
);

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.status = "idle";
      clearTokens();
      if (!isLocalMode()) {
        window.location.href = buildLogoutUrl();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initAuth.pending, (state) => {
        state.status = "loading";
      })
      .addCase(initAuth.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(initAuth.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Auth failed";
        state.isAuthenticated = false;
      })
      .addCase(handleCallback.pending, (state) => {
        state.status = "loading";
      })
      .addCase(handleCallback.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(handleCallback.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Callback failed";
        state.isAuthenticated = false;
      });
  },
});

export const { logout } = authSlice.actions;
