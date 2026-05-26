import { cognitoRefreshTokens } from "./cognito";
import {
  clearTokens,
  getIdToken,
  getRefreshToken,
  isTokenExpired,
  saveTokens,
  tokenExpiresIn,
} from "./tokenStorage";

const REFRESH_THRESHOLD_SECONDS = 30;

let inFlight: Promise<string | null> | null = null;
let onAuthFailure: (() => void) | null = null;

export const setAuthFailureHandler = (handler: (() => void) | null): void => {
  onAuthFailure = handler;
};

const refreshNow = async (): Promise<string | null> => {
  const refresh = getRefreshToken();
  if (!refresh) {
    clearTokens();
    onAuthFailure?.();
    return null;
  }

  try {
    const { id_token } = await cognitoRefreshTokens(refresh);
    saveTokens({ id_token, refresh_token: refresh });
    return id_token;
  } catch {
    clearTokens();
    onAuthFailure?.();
    return null;
  }
};

export const ensureFreshToken = (
  options: { force?: boolean } = {},
): Promise<string | null> => {
  const { force = false } = options;

  if (!force) {
    const token = getIdToken();
    if (token && !isTokenExpired(token) && tokenExpiresIn(token) > REFRESH_THRESHOLD_SECONDS) {
      return Promise.resolve(token);
    }
  }

  if (inFlight) return inFlight;

  inFlight = refreshNow().finally(() => {
    inFlight = null;
  });

  return inFlight;
};
