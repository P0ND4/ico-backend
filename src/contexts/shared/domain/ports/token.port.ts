export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface ITokenService {
  sign(
    payload: Record<string, unknown>,
    options?: { expiresIn?: string },
  ): Promise<string>;
  verify<T = Record<string, unknown>>(token: string): Promise<T>;
  decode<T = Record<string, unknown>>(token: string): T | null;
}
