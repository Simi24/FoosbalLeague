/**
 * Hybrid token storage.
 *
 * - ID token: in-memory only (short-lived, XSS-safe).
 * - Refresh token: persisted in localStorage so sessions survive page refresh.
 *   The refresh token is only exchangeable at Cognito's endpoint with the
 *   app's client ID, making localStorage an acceptable trade-off.
 */

const REFRESH_TOKEN_KEY = "foosball_refresh_token";

let idToken: string | null = null;
let refreshToken: string | null = null;

export const saveTokens = (tokens: { id_token: string; refresh_token: string }): void => {
  idToken = tokens.id_token;
  refreshToken = tokens.refresh_token;
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
};

export const getIdToken = (): string | null => idToken;

export const getRefreshToken = (): string | null =>
  refreshToken ?? localStorage.getItem(REFRESH_TOKEN_KEY);

export const clearTokens = (): void => {
  idToken = null;
  refreshToken = null;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]!));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};

/** Seconds until token expires, or 0 if already expired. */
export const tokenExpiresIn = (token: string): number => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]!));
    const remaining = payload.exp * 1000 - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  } catch {
    return 0;
  }
};
