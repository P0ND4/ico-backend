import type { DataSource } from 'typeorm';
import { AuthProviderEntity } from 'src/contexts/shared/domain/entities/catalog/auth-provider.entity';
import { AUTH_PROVIDER_IDS } from 'src/contexts/shared/constants/provider.constants';

export async function seedAuthProviders(ds: DataSource): Promise<void> {
  await ds.getRepository(AuthProviderEntity).upsert(
    [
      { id: AUTH_PROVIDER_IDS.GOOGLE, name: 'google', label: 'Google' },
      { id: AUTH_PROVIDER_IDS.APPLE,  name: 'apple',  label: 'Apple ID' },
      { id: AUTH_PROVIDER_IDS.GUEST,  name: 'guest',  label: 'Invitado' },
    ],
    { conflictPaths: ['id'], skipUpdateIfNoValuesChanged: true },
  );
}
