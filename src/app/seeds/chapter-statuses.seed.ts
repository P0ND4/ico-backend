import type { DataSource } from 'typeorm';
import { ChapterStatusEntity } from 'src/contexts/shared/domain/entities/catalog/chapter-status.entity';

export async function seedChapterStatuses(ds: DataSource): Promise<void> {
  await ds.getRepository(ChapterStatusEntity).upsert(
    [
      { code: 'locked',    label: 'Bloqueado' },
      { code: 'current',   label: 'En curso' },
      { code: 'completed', label: 'Completado' },
    ],
    { conflictPaths: ['code'], skipUpdateIfNoValuesChanged: true },
  );
}
