/**
 * In-memory token storage — not accessible via XSS (unlike sessionStorage).
 *
 * Trade-off: tokens are lost on page refresh, requiring re-authentication.
 * This is more secure than sessionStorage for SPAs with Cognito JWT.
 */

let idToken: string | null = null;
let refreshToken: string | null = null;

export const saveTokens = (tokens: { id_token: string; refresh_token: string }): void => {
  idToken = tokens.id_token;
  refreshToken = tokens.refresh_token;
};

export const getIdToken = (): string | null => idToken;

export const getRefreshToken = (): string | null => refreshToken;

export const clearTokens = (): void => {
  idToken = null;
  refreshToken = null;
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
