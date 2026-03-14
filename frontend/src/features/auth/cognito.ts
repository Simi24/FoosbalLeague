const COGNITO_CONFIG = {
  region: import.meta.env.VITE_COGNITO_REGION as string,
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID as string,
};

export class CognitoError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const cognitoRequest = async (
  action: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const response = await fetch(
    `https://cognito-idp.${COGNITO_CONFIG.region}.amazonaws.com/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-amz-json-1.1",
        "X-Amz-Target": `AWSCognitoIdentityProviderService.${action}`,
      },
      body: JSON.stringify(body),
    },
  );

  const data = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    const code = ((data.__type as string) ?? "UnknownError").split("#").pop()!;
    const message = (data.message as string) ?? "Cognito request failed";
    throw new CognitoError(code, message);
  }

  return data;
};

export const cognitoLogin = async (
  email: string,
  password: string,
): Promise<{ id_token: string; refresh_token: string }> => {
  const data = await cognitoRequest("InitiateAuth", {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: COGNITO_CONFIG.clientId,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  const result = data.AuthenticationResult as { IdToken: string; RefreshToken: string };
  return {
    id_token: result.IdToken,
    refresh_token: result.RefreshToken,
  };
};

export const cognitoSignUp = async (
  email: string,
  password: string,
  name: string,
): Promise<void> => {
  await cognitoRequest("SignUp", {
    ClientId: COGNITO_CONFIG.clientId,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: "email", Value: email },
      { Name: "name", Value: name },
    ],
  });
};

export const cognitoConfirmSignUp = async (
  email: string,
  code: string,
): Promise<void> => {
  await cognitoRequest("ConfirmSignUp", {
    ClientId: COGNITO_CONFIG.clientId,
    Username: email,
    ConfirmationCode: code,
  });
};
