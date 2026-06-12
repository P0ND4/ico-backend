import type { DataSource } from 'typeorm';
import { JobStatusEntity } from 'src/contexts/shared/domain/entities/catalog/job-status.entity';

export async function seedJobStatuses(ds: DataSource): Promise<void> {
  await ds.getRepository(JobStatusEntity).upsert(
    [
      { code: 'pending',    label: 'Pendiente' },
      { code: 'processing', label: 'Procesando' },
      { code: 'completed',  label: 'Completado' },
      { code: 'failed',     label: 'Fallido' },
    ],
    { conflictPaths: ['code'], skipUpdateIfNoValuesChanged: true },
  );
}
