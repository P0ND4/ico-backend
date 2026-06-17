import { Inject, Injectable } from '@nestjs/common';
import type { UserEntity } from 'src/contexts/shared/domain/entities/auth/user.entity';
import {
  JWT_EXPIRATION,
  JWT_REFRESH_EXPIRATION,
  REFRESH_BLACKLIST_TTL_SECONDS,
} from 'src/contexts/shared/constants/jwt.constants';
import { UNIT_OF_WORK } from 'src/contexts/shared/domain/repositories/unit-of-work.interface';
import type { IUnitOfWork } from 'src/contexts/shared/domain/repositories/unit-of-work.interface';
import { AUTH_PROVIDER_IDS } from 'src/contexts/shared/constants/provider.constants';
import {
  SocialAuthFailedError,
  ProviderAlreadyLinkedError,
} from '../../domain/errors/auth/index';
import { TOKEN_SERVICE } from 'src/contexts/shared/domain/ports/token.port';
import type { ITokenService } from 'src/contexts/shared/domain/ports/token.port';
import { TOKEN_BLACKLIST_PORT } from 'src/contexts/shared/domain/ports/token-blacklist.port';
import type { ITokenBlacklistPort } from 'src/contexts/shared/domain/ports/token-blacklist.port';
import {
  GOOGLE_AUTH_PORT,
  APPLE_AUTH_PORT,
} from '../../domain/ports/social-auth.port';
import type {
  IGoogleAuthPort,
  IAppleAuthPort,
} from '../../domain/ports/social-auth.port';
import type {
  IAuthUseCase,
  AuthResult,
} from '../../domain/contracts/i-auth.use-case';
import { InvalidTokenError } from '../../domain/errors/auth/invalid-token.error';

@Injectable()
export class AuthUseCase implements IAuthUseCase {
  constructor(
    @Inject(UNIT_OF_WORK)
    private readonly uow: IUnitOfWork,
    @Inject(TOKEN_BLACKLIST_PORT)
    private readonly tokenBlacklistPort: ITokenBlacklistPort,
    @Inject(GOOGLE_AUTH_PORT)
    private readonly googleAuthPort: IGoogleAuthPort,
    @Inject(APPLE_AUTH_PORT)
    private readonly appleAuthPort: IAppleAuthPort,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
  ) {}

  async refresh(refreshToken: string): Promise<AuthResult> {
    let payload: { sub: string; email: string };
    try {
      payload = await this.tokenService.verify<{ sub: string; email: string }>(
        refreshToken,
      );
    } catch {
      throw new InvalidTokenError();
    }

    const blacklisted =
      await this.tokenBlacklistPort.isBlacklisted(refreshToken);
    if (blacklisted) throw new InvalidTokenError();

    const user = await this.uow.users.findById(payload.sub);
    if (!user) throw new InvalidTokenError();

    await this.tokenBlacklistPort.add(
      refreshToken,
      REFRESH_BLACKLIST_TTL_SECONDS,
    );
    return this.buildAuthResponse(user);
  }

  async logout(
    accessToken: string,
    refreshToken?: string,
  ): Promise<{ message: string }> {
    try {
      const decoded = this.tokenService.decode<{ exp: number }>(accessToken);
      if (decoded?.exp) {
        const ttl = Math.max(decoded.exp - Math.floor(Date.now() / 1000), 1);
        await this.tokenBlacklistPort.add(accessToken, ttl);
      }
    } catch {
      // malformed token — nothing to blacklist
    }

    if (refreshToken) {
      await this.tokenBlacklistPort.add(
        refreshToken,
        REFRESH_BLACKLIST_TTL_SECONDS,
      );
    }
    return { message: 'Logged out successfully' };
  }

  async loginWithGoogle(idToken: string, deviceId?: string): Promise<AuthResult> {
    let socialData: Awaited<ReturnType<IGoogleAuthPort['verify']>>;
    try {
      socialData = await this.googleAuthPort.verify(idToken);
    } catch {
      throw new SocialAuthFailedError();
    }

    let user = await this.uow.users.findByProviderUserId(
      AUTH_PROVIDER_IDS.GOOGLE,
      socialData.providerId,
    );
    if (user?.deletedAt) user = null;

    if (!user) {
      // Fall back to email lookup for users who registered before provider migration
      user = socialData.email
        ? await this.uow.users.findByEmail(socialData.email)
        : null;
      if (user?.deletedAt) user = null;
    }

    if (!user) {
      user = await this.createSocialUser(
        {
          email: socialData.email ?? null,
          name: socialData.fullName ?? null,
        },
        AUTH_PROVIDER_IDS.GOOGLE,
        socialData.providerId,
        deviceId,
      );
    }

    return this.buildAuthResponse(user);
  }

  async loginWithApple(
    identityToken: string,
    fullName?: string,
    deviceId?: string,
  ): Promise<AuthResult> {
    let socialData: Awaited<ReturnType<IAppleAuthPort['verify']>>;
    try {
      socialData = await this.appleAuthPort.verify(identityToken);
    } catch {
      throw new SocialAuthFailedError();
    }

    let user = await this.uow.users.findByProviderUserId(
      AUTH_PROVIDER_IDS.APPLE,
      socialData.providerId,
    );
    if (user?.deletedAt) user = null;

    if (!user) {
      // Fall back to email lookup for users who registered before provider migration
      user = socialData.email
        ? await this.uow.users.findByEmail(socialData.email)
        : null;
      if (user?.deletedAt) user = null;
    }

    if (!user) {
      user = await this.createSocialUser(
        {
          email: socialData.email ?? null,
          name: fullName ?? socialData.fullName ?? null,
        },
        AUTH_PROVIDER_IDS.APPLE,
        socialData.providerId,
        deviceId,
      );
    }

    return this.buildAuthResponse(user);
  }

  async loginAsGuest(deviceId?: string): Promise<AuthResult> {
    if (deviceId) {
      const existing = await this.uow.users.findByGuestDeviceId(deviceId);
      if (existing && !existing.deletedAt) {
        return this.buildAuthResponse(existing);
      }
    }
    const trialUsed = await this.isDeviceTrialConsumed(deviceId);
    const user = await this.uow.users.create({
      name: null,
      email: null,
      avatarUrl: null,
      guestDeviceId: deviceId ?? null,
      deviceId: deviceId ?? null,
      freeTrialUsed: trialUsed,
    });
    await this.createUserStats(user.id);
    if (deviceId) {
      await this.uow.deviceTrials.ensureDeviceRecord(deviceId, user.id);
    }
    return this.buildAuthResponse(user);
  }

  private async createSocialUser(
    userData: Partial<UserEntity>,
    providerId: string,
    providerUserId: string,
    deviceId?: string,
  ): Promise<UserEntity> {
    const trialUsed = await this.isDeviceTrialConsumed(deviceId);
    const user = await this.uow.users.createWithProvider(
      {
        ...userData,
        deviceId: deviceId ?? null,
        freeTrialUsed: trialUsed,
      },
      providerId,
      providerUserId,
    );
    await this.createUserStats(user.id);
    if (deviceId) {
      await this.uow.deviceTrials.ensureDeviceRecord(deviceId, user.id);
    }
    return user;
  }

  private async isDeviceTrialConsumed(deviceId?: string): Promise<boolean> {
    if (!deviceId) return false;
    const freePlan = await this.uow.subscriptionPlans.findByCode('free');
    if (!freePlan?.enforceDeviceTrialSlot) return false;
    const record = await this.uow.deviceTrials.findByDeviceId(deviceId);
    return record !== null;
  }

  async linkGoogle(userId: string, idToken: string): Promise<void> {
    let socialData: Awaited<ReturnType<IGoogleAuthPort['verify']>>;
    try {
      socialData = await this.googleAuthPort.verify(idToken);
    } catch {
      throw new SocialAuthFailedError();
    }

    await this.linkProvider(
      userId,
      AUTH_PROVIDER_IDS.GOOGLE,
      socialData.providerId,
      socialData,
    );
  }

  async linkApple(
    userId: string,
    identityToken: string,
    fullName?: string,
  ): Promise<void> {
    let socialData: Awaited<ReturnType<IAppleAuthPort['verify']>>;
    try {
      socialData = await this.appleAuthPort.verify(identityToken);
    } catch {
      throw new SocialAuthFailedError();
    }

    await this.linkProvider(
      userId,
      AUTH_PROVIDER_IDS.APPLE,
      socialData.providerId,
      {
        ...socialData,
        fullName: fullName ?? socialData.fullName,
      },
    );
  }

  private async linkProvider(
    userId: string,
    providerId: string,
    providerUserId: string,
    socialData: { email?: string; fullName?: string },
  ): Promise<void> {
    // Check if this provider account is already linked
    const existing = await this.uow.users.findAuthProvider(
      providerId,
      providerUserId,
    );

    if (existing) {
      if (existing.userId === userId) {
        // Idempotent — already linked to same user
        return;
      }
      throw new ProviderAlreadyLinkedError();
    }

    // Link the provider to this user
    await this.uow.users.addAuthProvider(providerId, providerUserId, userId);

    // Upgrade guest user: fill in name/email if they were null
    const user = await this.uow.users.findById(userId);
    if (user) {
      const updates: Partial<typeof user> = {};
      if (!user.email && socialData.email) updates.email = socialData.email;
      if (!user.name && socialData.fullName) updates.name = socialData.fullName;
      if (Object.keys(updates).length > 0) {
        await this.uow.users.update(userId, updates);
      }
    }
  }

  private async createUserStats(userId: string): Promise<void> {
    await this.uow.userStats.create({ userId });
  }

  private async buildAuthResponse(user: UserEntity): Promise<AuthResult> {
    const payload = { sub: user.id, email: user.email ?? '' };
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.sign(payload, { expiresIn: JWT_EXPIRATION }),
      this.tokenService.sign(payload, { expiresIn: JWT_REFRESH_EXPIRATION }),
    ]);
    return { accessToken, refreshToken, user: this.toUserResponse(user) };
  }

  private toUserResponse(user: UserEntity): AuthResult['user'] {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl ?? null,
    };
  }
}
