import type { DataSource } from 'typeorm';
import { TagEntity } from 'src/contexts/shared/domain/entities/catalog/tag.entity';

export async function seedTags(ds: DataSource): Promise<void> {
  await ds.getRepository(TagEntity).upsert(
    [
      { name: 'Ciencias',     color: '#059669' },
      { name: 'Historia',     color: '#0891B2' },
      { name: 'Programación', color: '#7C3AED' },
      { name: 'Matemáticas',  color: '#D97706' },
      { name: 'Literatura',   color: '#DC2626' },
      { name: 'Filosofía',    color: '#6B7280' },
      { name: 'Arte',         color: '#EC4899' },
      { name: 'Economía',     color: '#F59E0B' },
    ],
    { conflictPaths: ['name'], skipUpdateIfNoValuesChanged: true },
  );
}
