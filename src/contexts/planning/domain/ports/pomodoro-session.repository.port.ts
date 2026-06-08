import { PomodoroSessionEntity } from 'src/contexts/shared/domain/entities/planning/pomodoro-session.entity';

export interface IPomodoroSessionRepository {
  findAllByUserId(
    userId: string,
    date?: string,
  ): Promise<PomodoroSessionEntity[]>;
  create(data: Partial<PomodoroSessionEntity>): Promise<PomodoroSessionEntity>;
}
