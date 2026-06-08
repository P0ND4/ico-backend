import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
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
import { StatsResponse } from '../responses/stats.response';
import type { JwtPayload } from 'src/contexts/shared/guards/jwt-auth.guard';

@ApiBearerAuth('access-token')
@ApiTags('Stats')
@Controller('v1/stats')
export class StatsController {
  constructor(
    @Inject(USER_PROFILE_USE_CASE)
    private readonly userProfileUseCase: IUserProfileUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user learning statistics',
    description:
      'Returns aggregated learning statistics for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User stats returned.',
    type: StatsResponse,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getStats(@Request() req: { user: JwtPayload }) {
    return this.userProfileUseCase.getStats(req.user.sub);
  }
}
