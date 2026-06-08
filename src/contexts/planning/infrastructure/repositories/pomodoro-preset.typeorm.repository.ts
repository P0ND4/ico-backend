import { Repository } from 'typeorm';
import { PomodoroPresetEntity } from 'src/contexts/shared/domain/entities/config/pomodoro-preset.entity';
import { IPomodoroPresetRepository } from '../../domain/ports/pomodoro-preset.repository.port';

export class PomodoroPresetTypeOrmRepository implements IPomodoroPresetRepository {
  constructor(private readonly repo: Repository<PomodoroPresetEntity>) {}

  findAll(): Promise<PomodoroPresetEntity[]> {
    return this.repo.find({ order: { sortOrder: 'ASC' } });
  }
}
