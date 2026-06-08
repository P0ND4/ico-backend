import { Inject, Injectable } from '@nestjs/common';
import { PomodoroPresetEntity } from 'src/contexts/shared/domain/entities/config/pomodoro-preset.entity';
import { PomodoroSessionEntity } from 'src/contexts/shared/domain/entities/planning/pomodoro-session.entity';
import { PLANNING_UNIT_OF_WORK } from '../../domain/unit-of-work.interface';
import type { IPlanningUnitOfWork } from '../../domain/unit-of-work.interface';
import type {
  IPomodoroUseCase,
  RecordPomodoroSessionParams,
  ListPomodoroSessionsParams,
} from '../../domain/contracts/i-pomodoro.use-case';

@Injectable()
export class PomodoroUseCase implements IPomodoroUseCase {
  constructor(
    @Inject(PLANNING_UNIT_OF_WORK)
    private readonly uow: IPlanningUnitOfWork,
  ) {}

  listPresets(): Promise<PomodoroPresetEntity[]> {
    return this.uow.presets.findAll();
  }

  async record(
    params: RecordPomodoroSessionParams,
  ): Promise<PomodoroSessionEntity> {
    const session = await this.uow.sessions.create({
      userId: params.userId,
      durationMinutes: params.durationMinutes,
      taskId: params.taskId ?? null,
      isCompleted: params.isCompleted,
      startedAt: new Date(params.startedAt),
      completedAt: params.completedAt ? new Date(params.completedAt) : null,
    });

    if (params.isCompleted) {
      let stats = await this.uow.userStats.findByUserId(params.userId);

      if (!stats) {
        stats = await this.uow.userStats.create({
          userId: params.userId,
          pomodoroSessionsDone: 0,
          totalStudyMinutes: 0,
        });
      }

      stats.pomodoroSessionsDone = stats.pomodoroSessionsDone + 1;
      stats.totalStudyMinutes =
        stats.totalStudyMinutes + params.durationMinutes;
      await this.uow.userStats.save(stats);
    }

    return session;
  }

  listSessions(
    params: ListPomodoroSessionsParams,
  ): Promise<PomodoroSessionEntity[]> {
    return this.uow.sessions.findAllByUserId(params.userId, params.date);
  }
}
