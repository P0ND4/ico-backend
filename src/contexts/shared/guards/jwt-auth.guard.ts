import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { TOKEN_BLACKLIST_PORT } from '../domain/ports/token-blacklist.port';
import type { ITokenBlacklistPort } from '../domain/ports/token-blacklist.port';
import { TOKEN_SERVICE } from '../domain/ports/token.port';
import type { ITokenService } from '../domain/ports/token.port';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
    private readonly reflector: Reflector,
    @Inject(TOKEN_BLACKLIST_PORT)
    private readonly tokenBlacklistPort: ITokenBlacklistPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request);

    if (!token) throw new UnauthorizedException('Missing access token');

    let payload: JwtPayload;
    try {
      payload = await this.tokenService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const blacklisted = await this.tokenBlacklistPort.isBlacklisted(token);
    if (blacklisted) throw new UnauthorizedException('Token has been revoked');

    request['user'] = payload;
    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const auth = request.headers.authorization;
    if (auth?.startsWith('Bearer ')) return auth.slice(7).trim() || null;
    // SSE clients (EventSource) cannot set headers — accept token via query param
    const queryToken = request.query['token'];
    if (typeof queryToken === 'string' && queryToken) return queryToken;
    return null;
  }
}
