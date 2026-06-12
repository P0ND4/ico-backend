import type { DataSource } from 'typeorm';
import { AppSettingsEntity } from 'src/contexts/shared/domain/entities/config/app-settings.entity';

export async function seedAppSettings(ds: DataSource): Promise<void> {
  await ds.getRepository(AppSettingsEntity).upsert(
    [
      { key: 'ai_model',                  value: 'gpt-4o', description: 'Modelo de IA usado para generación de rutas y tutor' },
      { key: 'max_chapters_per_path',     value: '5',      description: 'Cantidad máxima de capítulos por ruta generada' },
      { key: 'max_lessons_per_chapter',   value: '6',      description: 'Cantidad máxima de lecciones por capítulo' },
      { key: 'guest_session_days',        value: '7',      description: 'Días de validez de una sesión de invitado' },
      { key: 'xp_per_correct_answer',     value: '20',     description: 'XP base otorgado por respuesta correcta' },
      { key: 'path_generation_timeout_s', value: '30',     description: 'Segundos máximos para esperar generación de ruta' },
    ],
    { conflictPaths: ['key'], skipUpdateIfNoValuesChanged: true },
  );
}
