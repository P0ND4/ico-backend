import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { minutes, Throttle } from '@nestjs/throttler';
import { Public } from 'src/contexts/shared/decorators/public.decorator';
import { AUTH_USE_CASE } from '../../../../../domain/contracts/i-auth.use-case';
import type { IAuthUseCase } from '../../../../../domain/contracts/i-auth.use-case';
import { AuthResponseResponse } from '../responses/auth-response.response';
import { AppleAuthRequest } from '../requests/apple-auth.request';
import { GoogleAuthRequest } from '../requests/google-auth.request';
import { LogoutRequest } from '../requests/logout.request';
import { RefreshRequest } from '../requests/refresh.request';
import { GuestAuthRequest } from '../requests/guest-auth.request';

@Public()
@ApiTags('Auth')
@Controller('v1/auth')
export class AuthController {
  constructor(
    @Inject(AUTH_USE_CASE) private readonly authUseCase: IAuthUseCase,
  ) {}

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: minutes(15) } })
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Validates the refresh token, blacklists it, and issues a new access token + refresh token pair (token rotation).',
  })
  @ApiResponse({
    status: 200,
    description: 'New token pair issued.',
    type: AuthResponseResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid, expired, or already used refresh token.',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Limit: 10 per 15 min.',
  })
  refresh(@Body() req: RefreshRequest) {
    return this.authUseCase.refresh(req.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Logout',
    description:
      'Blacklists the access token (from Authorization header) and optionally the refresh token (from body). Both tokens become immediately invalid.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: { message: 'Logged out successfully' },
      },
    },
  })
  logout(
    @Headers('authorization') authorization: string,
    @Body() req: LogoutRequest,
  ) {
    const accessToken = authorization?.replace(/^Bearer\s+/i, '').trim() ?? '';
    return this.authUseCase.logout(accessToken, req.refreshToken);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: minutes(15) } })
  @ApiOperation({
    summary: 'Login or register with Google',
    description:
      'Verifies the Google ID token. If the user exists, logs them in. If not, creates a new verified account automatically.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful. Tokens issued.',
    type: AuthResponseResponse,
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired Google token.' })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Limit: 10 per 15 min.',
  })
  loginWithGoogle(@Body() req: GoogleAuthRequest) {
    return this.authUseCase.loginWithGoogle(req.idToken, req.deviceId);
  }

  @Post('apple')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: minutes(15) } })
  @ApiOperation({
    summary: 'Login or register with Apple',
    description:
      'Verifies the Apple identity token. If the user exists, logs them in. If not, creates a new verified account. Note: fullName is only provided by Apple on the first sign-in.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful. Tokens issued.',
    type: AuthResponseResponse,
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired Apple token.' })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Limit: 10 per 15 min.',
  })
  loginWithApple(@Body() req: AppleAuthRequest) {
    return this.authUseCase.loginWithApple(req.identityToken, req.fullName, req.deviceId);
  }

  @Post('guest')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: minutes(15) } })
  @ApiOperation({
    summary: 'Login as guest',
    description:
      'Creates an anonymous user account with no email or name. Issues access + refresh tokens. The guest account can later be upgraded by linking a social provider.',
  })
  @ApiResponse({
    status: 200,
    description: 'Guest account created and tokens issued.',
    type: AuthResponseResponse,
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Limit: 10 per 15 min.',
  })
  loginAsGuest(@Body() req: GuestAuthRequest) {
    return this.authUseCase.loginAsGuest(req.deviceId);
  }
}
