import type { DataSource } from 'typeorm';
import { XpLevelEntity } from 'src/contexts/shared/domain/entities/config/xp-level.entity';

export async function seedXpLevels(ds: DataSource): Promise<void> {
  await ds.getRepository(XpLevelEntity).upsert(
    [
      { level: 1,  label: 'Principiante', minXp: 0,     maxXp: 499 },
      { level: 2,  label: 'Explorador',   minXp: 500,   maxXp: 1099 },
      { level: 3,  label: 'Estudiante',   minXp: 1100,  maxXp: 1999 },
      { level: 4,  label: 'Analista',     minXp: 2000,  maxXp: 3199 },
      { level: 5,  label: 'Pensador',     minXp: 3200,  maxXp: 4799 },
      { level: 6,  label: 'Investigador', minXp: 4800,  maxXp: 6799 },
      { level: 7,  label: 'Experto',      minXp: 6800,  maxXp: 9299 },
      { level: 8,  label: 'Maestro',      minXp: 9300,  maxXp: 12299 },
      { level: 9,  label: 'Visionario',   minXp: 12300, maxXp: 15999 },
      { level: 10, label: 'AutoLearner',  minXp: 16000, maxXp: 2147483647 },
    ],
    { conflictPaths: ['level'], skipUpdateIfNoValuesChanged: true },
  );
}
