import type { PomodoroPresetEntity } from 'src/contexts/shared/domain/entities/config/pomodoro-preset.entity';
import type { PomodoroSessionEntity } from 'src/contexts/shared/domain/entities/planning/pomodoro-session.entity';

export const POMODORO_USE_CASE = Symbol('POMODORO_USE_CASE');

export interface RecordPomodoroSessionParams {
  userId: string;
  durationMinutes: number;
  taskId?: string;
  isCompleted: boolean;
  startedAt: string;
  completedAt?: string;
}

export interface ListPomodoroSessionsParams {
  userId: string;
  date?: string;
}

export interface IPomodoroUseCase {
  listPresets(): Promise<PomodoroPresetEntity[]>;
  record(params: RecordPomodoroSessionParams): Promise<PomodoroSessionEntity>;
  listSessions(
    params: ListPomodoroSessionsParams,
  ): Promise<PomodoroSessionEntity[]>;
}
