import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import type {
  IGoogleAuthPort,
  SocialUserData,
} from '../../domain/ports/social-auth.port';

@Injectable()
export class GoogleAuthService implements IGoogleAuthPort {
  private readonly client: OAuth2Client;

  constructor(private readonly config: ConfigService) {
    this.client = new OAuth2Client(config.get<string>('GOOGLE_CLIENT_ID'));
  }

  async verify(idToken: string): Promise<SocialUserData> {
    const ticket = await this.client.verifyIdToken({
      idToken,
      audience: this.config.get<string>('GOOGLE_CLIENT_ID'),
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      throw new Error('Incomplete Google token payload');
    }
    return {
      providerId: payload.sub,
      email: payload.email,
      fullName: payload.name,
    };
  }
}
