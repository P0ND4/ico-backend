export const TOKEN_BLACKLIST_PORT = 'TOKEN_BLACKLIST_PORT';

export interface ITokenBlacklistPort {
  add(token: string, ttlSeconds?: number): Promise<void>;
  isBlacklisted(token: string): Promise<boolean>;
}
