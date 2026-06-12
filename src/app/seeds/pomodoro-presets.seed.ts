import type { DataSource } from 'typeorm';
import { PomodoroPresetEntity } from 'src/contexts/shared/domain/entities/config/pomodoro-preset.entity';

export async function seedPomodoroPresets(ds: DataSource): Promise<void> {
  await ds.getRepository(PomodoroPresetEntity).upsert(
    [
      { durationMinutes: 25, label: 'Sesión corta', isDefault: false, sortOrder: 1 },
      { durationMinutes: 45, label: 'Estándar',     isDefault: true,  sortOrder: 2 },
      { durationMinutes: 60, label: 'Sesión larga', isDefault: false, sortOrder: 3 },
    ],
    { conflictPaths: ['durationMinutes'], skipUpdateIfNoValuesChanged: true },
  );
}
