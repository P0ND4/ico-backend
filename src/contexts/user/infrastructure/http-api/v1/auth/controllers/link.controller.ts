import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AUTH_USE_CASE } from '../../../../../domain/contracts/i-auth.use-case';
import type { IAuthUseCase } from '../../../../../domain/contracts/i-auth.use-case';
import { LinkGoogleRequest } from '../requests/link-google.request';
import { LinkAppleRequest } from '../requests/link-apple.request';
import type { JwtPayload } from 'src/contexts/shared/guards/jwt-auth.guard';

@ApiBearerAuth('access-token')
@ApiTags('Auth')
@Controller('v1/auth/link')
export class LinkController {
  constructor(
    @Inject(AUTH_USE_CASE)
    private readonly authUseCase: IAuthUseCase,
  ) {}

  @Post('google')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Link Google account',
    description:
      'Links a Google social account to the authenticated user. Idempotent if already linked to the same user. Fails with 409 if linked to a different user.',
  })
  @ApiResponse({ status: 204, description: 'Provider linked successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token.' })
  @ApiResponse({
    status: 409,
    description: 'Provider already linked to a different user.',
  })
  linkGoogle(
    @Request() req: { user: JwtPayload },
    @Body() body: LinkGoogleRequest,
  ) {
    return this.authUseCase.linkGoogle(req.user.sub, body.idToken);
  }

  @Post('apple')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Link Apple account',
    description:
      'Links an Apple social account to the authenticated user. Idempotent if already linked to the same user. Fails with 409 if linked to a different user.',
  })
  @ApiResponse({ status: 204, description: 'Provider linked successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token.' })
  @ApiResponse({
    status: 409,
    description: 'Provider already linked to a different user.',
  })
  linkApple(
    @Request() req: { user: JwtPayload },
    @Body() body: LinkAppleRequest,
  ) {
    return this.authUseCase.linkApple(
      req.user.sub,
      body.identityToken,
      body.fullName,
    );
  }
}
