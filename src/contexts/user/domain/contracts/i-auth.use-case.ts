export const AUTH_USE_CASE = Symbol('AUTH_USE_CASE');

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
}

export interface IAuthUseCase {
  refresh(refreshToken: string): Promise<AuthResult>;
  logout(
    accessToken: string,
    refreshToken?: string,
  ): Promise<{ message: string }>;
  loginWithGoogle(idToken: string, deviceId?: string): Promise<AuthResult>;
  loginWithApple(identityToken: string, fullName?: string, deviceId?: string): Promise<AuthResult>;
  loginAsGuest(deviceId?: string): Promise<AuthResult>;
  linkGoogle(userId: string, idToken: string): Promise<void>;
  linkApple(
    userId: string,
    identityToken: string,
    fullName?: string,
  ): Promise<void>;
}
