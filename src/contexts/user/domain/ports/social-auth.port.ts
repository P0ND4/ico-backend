export interface SocialUserData {
  providerId: string;
  email: string;
  fullName?: string;
}

export const GOOGLE_AUTH_PORT = Symbol('GOOGLE_AUTH_PORT');
export interface IGoogleAuthPort {
  verify(idToken: string): Promise<SocialUserData>;
}

export const APPLE_AUTH_PORT = Symbol('APPLE_AUTH_PORT');
export interface IAppleAuthPort {
  verify(identityToken: string): Promise<SocialUserData>;
}
