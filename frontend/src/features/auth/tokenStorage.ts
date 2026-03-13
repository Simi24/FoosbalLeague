const ID_TOKEN_KEY = "foosball_id_token";
const REFRESH_TOKEN_KEY = "foosball_refresh_token";

export const saveTokens = (tokens: { id_token: string; refresh_token: string }): void => {
  sessionStorage.setItem(ID_TOKEN_KEY, tokens.id_token);
  sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
};

export const getIdToken = (): string | null => {
  return sessionStorage.getItem(ID_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
};

export const clearTokens = (): void => {
  sessionStorage.removeItem(ID_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]!));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};
