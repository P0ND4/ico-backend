import { PomodoroPresetEntity } from 'src/contexts/shared/domain/entities/config/pomodoro-preset.entity';

export interface IPomodoroPresetRepository {
  findAll(): Promise<PomodoroPresetEntity[]>;
}
