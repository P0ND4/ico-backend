import type { AuthResult } from '../../domain/contracts/i-auth.use-case';

export class AuthResponseDto implements AuthResult {
  accessToken!: string;
  refreshToken!: string;
  user!: {
    id: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
}
