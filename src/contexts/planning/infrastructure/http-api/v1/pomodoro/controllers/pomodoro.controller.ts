import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { JwtPayload } from 'src/contexts/shared/guards/jwt-auth.guard';
import { POMODORO_USE_CASE } from 'src/contexts/planning/domain/contracts/i-pomodoro.use-case';
import type { IPomodoroUseCase } from 'src/contexts/planning/domain/contracts/i-pomodoro.use-case';
import { RecordSessionRequest } from '../requests/record-session.request';

@ApiBearerAuth('access-token')
@ApiTags('Plan Pomodoro')
@Controller('plan/pomodoro')
export class PomodoroController {
  constructor(
    @Inject(POMODORO_USE_CASE)
    private readonly pomodoroUseCase: IPomodoroUseCase,
  ) {}

  @Get('presets')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all pomodoro presets' })
  listPresets() {
    return this.pomodoroUseCase.listPresets();
  }

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a pomodoro session' })
  recordSession(
    @Request() req: { user: JwtPayload },
    @Body() body: RecordSessionRequest,
  ) {
    return this.pomodoroUseCase.record({
      userId: req.user.sub,
      durationMinutes: body.durationMinutes,
      taskId: body.taskId,
      isCompleted: body.isCompleted,
      startedAt: body.startedAt,
      completedAt: body.completedAt,
    });
  }

  @Get('sessions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List pomodoro sessions for the current user' })
  listSessions(
    @Request() req: { user: JwtPayload },
    @Query('date') date?: string,
  ) {
    return this.pomodoroUseCase.listSessions({ userId: req.user.sub, date });
  }
}
