import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Patch,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { USER_PROFILE_USE_CASE } from '../../../../../domain/contracts/i-user-profile.use-case';
import type { IUserProfileUseCase } from '../../../../../domain/contracts/i-user-profile.use-case';
import { UpdateProfileRequest } from '../requests/update-profile.request';
import { UserProfileResponse } from '../responses/user-profile.response';
import type { JwtPayload } from 'src/contexts/shared/guards/jwt-auth.guard';

@ApiBearerAuth('access-token')
@ApiTags('Users')
@Controller('v1/users')
export class UsersController {
  constructor(
    @Inject(USER_PROFILE_USE_CASE)
    private readonly userProfileUseCase: IUserProfileUseCase,
  ) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns the authenticated user profile.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile returned.',
    type: UserProfileResponse,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getMe(@Request() req: { user: JwtPayload }) {
    return this.userProfileUseCase.getMe(req.user.sub);
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Updates name and/or avatarUrl for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Updated user profile returned.',
    type: UserProfileResponse,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  updateMe(
    @Request() req: { user: JwtPayload },
    @Body() body: UpdateProfileRequest,
  ) {
    return this.userProfileUseCase.updateMe(req.user.sub, {
      name: body.name,
      avatarUrl: body.avatarUrl,
    });
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete current user account',
    description:
      'Permanently deletes the authenticated user and all related data (cascade).',
  })
  @ApiResponse({ status: 204, description: 'Account deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  deleteMe(@Request() req: { user: JwtPayload }) {
    return this.userProfileUseCase.deleteMe(req.user.sub);
  }
}
