import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { PlanTaskEntity } from 'src/contexts/shared/domain/entities/planning/plan-task.entity';
import { PomodoroSessionEntity } from 'src/contexts/shared/domain/entities/planning/pomodoro-session.entity';
import { PomodoroPresetEntity } from 'src/contexts/shared/domain/entities/config/pomodoro-preset.entity';
import { UserStatsEntity } from 'src/contexts/shared/domain/entities/auth/user-stats.entity';
import { TaskTypeOrmRepository } from '../repositories/task.typeorm.repository';
import { PomodoroSessionTypeOrmRepository } from '../repositories/pomodoro-session.typeorm.repository';
import { PomodoroPresetTypeOrmRepository } from '../repositories/pomodoro-preset.typeorm.repository';
import { UserStatsTypeOrmRepository } from 'src/contexts/shared/infrastructure/repositories/auth/user-stats.typeorm.repository';
import type { IPlanningUnitOfWork } from '../../domain/unit-of-work.interface';
import type { ITaskRepository } from '../../domain/ports/task.repository.port';
import type { IPomodoroSessionRepository } from '../../domain/ports/pomodoro-session.repository.port';
import type { IPomodoroPresetRepository } from '../../domain/ports/pomodoro-preset.repository.port';
import type { IUserStatsRepository } from 'src/contexts/shared/domain/repositories/auth/user-stats.repository.interface';

@Injectable()
export class TypeOrmPlanningUnitOfWork implements IPlanningUnitOfWork {
  readonly tasks: ITaskRepository;
  readonly sessions: IPomodoroSessionRepository;
  readonly presets: IPomodoroPresetRepository;
  readonly userStats: IUserStatsRepository;

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(PlanTaskEntity) taskRepo: Repository<PlanTaskEntity>,
    @InjectRepository(PomodoroSessionEntity)
    sessionRepo: Repository<PomodoroSessionEntity>,
    @InjectRepository(PomodoroPresetEntity)
    presetRepo: Repository<PomodoroPresetEntity>,
    @InjectRepository(UserStatsEntity) statsRepo: Repository<UserStatsEntity>,
  ) {
    this.tasks = new TaskTypeOrmRepository(taskRepo);
    this.sessions = new PomodoroSessionTypeOrmRepository(sessionRepo);
    this.presets = new PomodoroPresetTypeOrmRepository(presetRepo);
    this.userStats = new UserStatsTypeOrmRepository(statsRepo);
  }

  async withTransaction<R>(
    fn: (uow: IPlanningUnitOfWork) => Promise<R>,
  ): Promise<R> {
    return this.dataSource.transaction((manager) =>
      fn(this.buildTransactional(manager)),
    );
  }

  private buildTransactional(manager: EntityManager): IPlanningUnitOfWork {
    const tx: IPlanningUnitOfWork = {
      tasks: new TaskTypeOrmRepository(manager.getRepository(PlanTaskEntity)),
      sessions: new PomodoroSessionTypeOrmRepository(
        manager.getRepository(PomodoroSessionEntity),
      ),
      presets: new PomodoroPresetTypeOrmRepository(
        manager.getRepository(PomodoroPresetEntity),
      ),
      userStats: new UserStatsTypeOrmRepository(
        manager.getRepository(UserStatsEntity),
      ),
      withTransaction: <T>(innerFn: (uow: IPlanningUnitOfWork) => Promise<T>) =>
        innerFn(tx),
    };
    return tx;
  }
}
