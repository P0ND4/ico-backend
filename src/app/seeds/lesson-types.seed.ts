import type { DataSource } from 'typeorm';
import { LessonTypeEntity } from 'src/contexts/shared/domain/entities/catalog/lesson-type.entity';

export async function seedLessonTypes(ds: DataSource): Promise<void> {
  await ds.getRepository(LessonTypeEntity).upsert(
    [
      { code: 'theory',          label: 'Teoría' },
      { code: 'concept',         label: 'Concepto' },
      { code: 'example',         label: 'Ejemplo' },
      { code: 'multiple_choice', label: 'Opción múltiple' },
      { code: 'true_false',      label: 'Verdadero/Falso' },
      { code: 'open_ended',      label: 'Respuesta abierta' },
    ],
    { conflictPaths: ['code'], skipUpdateIfNoValuesChanged: true },
  );
}
