import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyIdToken } from 'apple-signin-auth';
import type {
  IAppleAuthPort,
  SocialUserData,
} from '../../domain/ports/social-auth.port';

@Injectable()
export class AppleAuthService implements IAppleAuthPort {
  constructor(private readonly config: ConfigService) {}

  async verify(identityToken: string): Promise<SocialUserData> {
    const payload = await verifyIdToken(identityToken, {
      audience: this.config.get<string>('APPLE_CLIENT_ID'),
    });
    return {
      providerId: payload.sub,
      email: payload.email,
    };
  }
}
