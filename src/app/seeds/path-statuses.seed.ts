import type { DataSource } from 'typeorm';
import { PathStatusEntity } from 'src/contexts/shared/domain/entities/catalog/path-status.entity';

export async function seedPathStatuses(ds: DataSource): Promise<void> {
  await ds.getRepository(PathStatusEntity).upsert(
    [
      { code: 'active',    label: 'Activa' },
      { code: 'completed', label: 'Completada' },
      { code: 'archived',  label: 'Archivada' },
    ],
    { conflictPaths: ['code'], skipUpdateIfNoValuesChanged: true },
  );
}
