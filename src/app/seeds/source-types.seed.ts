import type { DataSource } from 'typeorm';
import { SourceTypeEntity } from 'src/contexts/shared/domain/entities/catalog/source-type.entity';

export async function seedSourceTypes(ds: DataSource): Promise<void> {
  await ds.getRepository(SourceTypeEntity).upsert(
    [
      { code: 'text', label: 'Texto plano' },
      { code: 'pdf',  label: 'PDF' },
      { code: 'docx', label: 'Word' },
      { code: 'txt',  label: 'TXT' },
    ],
    { conflictPaths: ['code'], skipUpdateIfNoValuesChanged: true },
  );
}
