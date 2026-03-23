import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import { apiFetch } from "@/api";
import { cognitoLogin, cognitoRefreshTokens } from "./cognito";
import {
  saveTokens,
  getIdToken,
  getRefreshToken,
  clearTokens,
  isTokenExpired,
  tokenExpiresIn,
} from "./tokenStorage";

type UserInfo = {
  sub: string;
  email: string;
  name: string;
  groups: string[];
  tenant_id: string;
  player_id: string | null;
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

/** Refresh the ID token using the stored refresh token. */
export const refreshAuth = createAsyncThunk("auth/refresh", async () => {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error("No refresh token");

  const { id_token } = await cognitoRefreshTokens(refresh);
  // Keep existing refresh token, update only id_token
  saveTokens({ id_token, refresh_token: refresh });

  return fetchMe();
});

export const initAuth = createAsyncThunk(
  "auth/initAuth",
  async () => {
    const token = getIdToken();
    if (token && !isTokenExpired(token)) {
      return fetchMe();
    }

    // ID token missing or expired — try to refresh using persisted refresh token
    const refresh = getRefreshToken();
    if (!refresh) {
      clearTokens();
      throw new Error("No valid token");
    }

    const { id_token } = await cognitoRefreshTokens(refresh);
    saveTokens({ id_token, refresh_token: refresh });
    return fetchMe();
  },
);

export const loginWithCredentials = createAsyncThunk(
  "auth/loginWithCredentials",
  async ({ email, password }: { email: string; password: string }) => {
    const tokens = await cognitoLogin(email, password);
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
      .addCase(loginWithCredentials.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginWithCredentials.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginWithCredentials.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Login failed";
        state.isAuthenticated = false;
      })
      .addCase(refreshAuth.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(refreshAuth.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = "failed";
        clearTokens();
      });
  },
});

export const { logout } = authSlice.actions;

/**
 * Schedule a token refresh 60 seconds before the current ID token expires.
 * Call after login or initAuth succeeds. Returns a cleanup function.
 */
export const scheduleTokenRefresh = (
  dispatch: (action: unknown) => unknown,
): (() => void) => {
  const token = getIdToken();
  if (!token) return () => {};

  const expiresIn = tokenExpiresIn(token);
  const refreshIn = Math.max(0, expiresIn - 60) * 1000; // 60s before expiry

  const timer = setTimeout(() => {
    dispatch(refreshAuth());
  }, refreshIn);

  return () => clearTimeout(timer);
};
