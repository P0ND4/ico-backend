import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PlanTaskEntity } from 'src/contexts/shared/domain/entities/planning/plan-task.entity';
import { PomodoroSessionEntity } from 'src/contexts/shared/domain/entities/planning/pomodoro-session.entity';
import { PomodoroPresetEntity } from 'src/contexts/shared/domain/entities/config/pomodoro-preset.entity';
import { UserStatsEntity } from 'src/contexts/shared/domain/entities/auth/user-stats.entity';
import { PLANNING_UNIT_OF_WORK } from 'src/contexts/planning/domain/unit-of-work.interface';
import { TASK_USE_CASE } from 'src/contexts/planning/domain/contracts/i-task.use-case';
import { POMODORO_USE_CASE } from 'src/contexts/planning/domain/contracts/i-pomodoro.use-case';
import { TypeOrmPlanningUnitOfWork } from '../../uow/typeorm-planning-unit-of-work';
import { TaskUseCase } from 'src/contexts/planning/application/use-cases/task.use-case';
import { PomodoroUseCase } from 'src/contexts/planning/application/use-cases/pomodoro.use-case';
import { TasksController } from './tasks/controllers/tasks.controller';
import { PomodoroController } from './pomodoro/controllers/pomodoro.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlanTaskEntity,
      PomodoroSessionEntity,
      PomodoroPresetEntity,
      UserStatsEntity,
    ]),
    ConfigModule,
  ],
  controllers: [TasksController, PomodoroController],
  providers: [
    {
      provide: PLANNING_UNIT_OF_WORK,
      useClass: TypeOrmPlanningUnitOfWork,
    },
    {
      provide: TASK_USE_CASE,
      useClass: TaskUseCase,
    },
    {
      provide: POMODORO_USE_CASE,
      useClass: PomodoroUseCase,
    },
  ],
})
export class PlanModule {}
