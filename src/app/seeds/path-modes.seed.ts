import type { DataSource } from 'typeorm';
import { PathModeEntity } from 'src/contexts/shared/domain/entities/catalog/path-mode.entity';

export async function seedPathModes(ds: DataSource): Promise<void> {
  await ds.getRepository(PathModeEntity).upsert(
    [
      { code: 'standard', label: 'Estándar' },
      { code: 'deep',     label: 'Profundo' },
    ],
    { conflictPaths: ['code'], skipUpdateIfNoValuesChanged: true },
  );
}
