import { Module } from '@nestjs/common';
import { SharedModule } from 'src/contexts/shared/shared.module';
import { RedisModule } from 'src/database/redis.module';
import {
  APPLE_AUTH_PORT,
  GOOGLE_AUTH_PORT,
} from '../../../../domain/ports/social-auth.port';
import { AuthUseCase } from '../../../../application/use-cases/auth.use-case';
import { AUTH_USE_CASE } from '../../../../domain/contracts/i-auth.use-case';
import { AppleAuthService } from '../../../services/apple-auth.service';
import { GoogleAuthService } from '../../../services/google-auth.service';
import { AuthController } from './controllers/auth.controller';
import { LinkController } from './controllers/link.controller';

@Module({
  imports: [SharedModule, RedisModule],
  providers: [
    { provide: AUTH_USE_CASE, useClass: AuthUseCase },
    { provide: GOOGLE_AUTH_PORT, useClass: GoogleAuthService },
    { provide: APPLE_AUTH_PORT, useClass: AppleAuthService },
  ],
  controllers: [AuthController, LinkController],
})
export class AuthModule {}
