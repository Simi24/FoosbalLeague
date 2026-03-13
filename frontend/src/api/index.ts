import { getIdToken } from "@/features/auth/tokenStorage";
import { isLocalMode } from "@/features/auth/cognito";

export const API_BASE_URL = "/api/v1";

export const apiFetch = async (path: string, options: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(options.headers);

  if (!isLocalMode()) {
    const token = getIdToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
};
