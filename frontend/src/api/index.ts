import { ensureFreshToken } from "@/features/auth/refreshGate";
import { getIdToken } from "@/features/auth/tokenStorage";

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "/api/v1";

const performFetch = (path: string, options: RequestInit): Promise<Response> => {
  const headers = new Headers(options.headers);
  const token = getIdToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
};

export const apiFetch = async (
  path: string,
  options: RequestInit = {},
): Promise<Response> => {
  await ensureFreshToken();
  let response = await performFetch(path, options);

  if (response.status === 401) {
    const refreshed = await ensureFreshToken({ force: true });
    if (refreshed) {
      response = await performFetch(path, options);
    }
  }

  return response;
};
