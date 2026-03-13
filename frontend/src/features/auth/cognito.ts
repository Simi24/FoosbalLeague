const COGNITO_CONFIG = {
  domain: import.meta.env.VITE_COGNITO_DOMAIN as string | undefined,
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID as string | undefined,
  redirectUri: import.meta.env.VITE_COGNITO_REDIRECT_URI as string | undefined,
};

export const isLocalMode = (): boolean => {
  return !COGNITO_CONFIG.domain;
};

const generateRandomBytes = (length: number): Uint8Array => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
};

const base64UrlEncode = (bytes: Uint8Array): string => {
  const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
  return btoa(binString).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export const generateCodeVerifier = (): string => {
  return base64UrlEncode(generateRandomBytes(32));
};

export const generateCodeChallenge = async (verifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
};

export const buildLoginUrl = async (): Promise<string> => {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  sessionStorage.setItem("pkce_code_verifier", verifier);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: COGNITO_CONFIG.clientId!,
    redirect_uri: COGNITO_CONFIG.redirectUri!,
    scope: "email openid profile",
    code_challenge_method: "S256",
    code_challenge: challenge,
  });

  return `https://${COGNITO_CONFIG.domain}/authorize?${params.toString()}`;
};

export const exchangeCodeForTokens = async (
  code: string,
): Promise<{ id_token: string; refresh_token: string }> => {
  const codeVerifier = sessionStorage.getItem("pkce_code_verifier");
  sessionStorage.removeItem("pkce_code_verifier");

  if (!codeVerifier) {
    throw new Error("Missing PKCE code verifier");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: COGNITO_CONFIG.clientId!,
    redirect_uri: COGNITO_CONFIG.redirectUri!,
    code,
    code_verifier: codeVerifier,
  });

  const response = await fetch(`https://${COGNITO_CONFIG.domain}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error("Token exchange failed");
  }

  return response.json();
};

export const buildLogoutUrl = (): string => {
  const params = new URLSearchParams({
    client_id: COGNITO_CONFIG.clientId!,
    logout_uri: COGNITO_CONFIG.redirectUri!,
  });

  return `https://${COGNITO_CONFIG.domain}/logout?${params.toString()}`;
};
