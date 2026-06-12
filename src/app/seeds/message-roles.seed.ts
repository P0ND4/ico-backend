import type { DataSource } from 'typeorm';
import { MessageRoleEntity } from 'src/contexts/shared/domain/entities/catalog/message-role.entity';

export async function seedMessageRoles(ds: DataSource): Promise<void> {
  await ds.getRepository(MessageRoleEntity).upsert(
    [
      { code: 'user',  label: 'Usuario' },
      { code: 'model', label: 'Modelo' },
    ],
    { conflictPaths: ['code'], skipUpdateIfNoValuesChanged: true },
  );
}
