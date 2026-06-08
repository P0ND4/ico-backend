import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import type { ITokenService } from 'src/contexts/shared/domain/ports/token.port';

@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(private readonly jwtService: JwtService) {}

  async sign(
    payload: Record<string, unknown>,
    options?: { expiresIn?: string },
  ): Promise<string> {
    const signOptions: JwtSignOptions | undefined = options
      ? { expiresIn: options.expiresIn as JwtSignOptions['expiresIn'] }
      : undefined;
    return this.jwtService.signAsync(payload, signOptions);
  }

  async verify<T = Record<string, unknown>>(token: string): Promise<T> {
    return this.jwtService.verifyAsync<T & object>(token) as Promise<T>;
  }

  decode<T = Record<string, unknown>>(token: string): T | null {
    const result = this.jwtService.decode<T>(token);
    return result ?? null;
  }
}
