import { IBaseRepository } from '../base-repository.interface';
import { UserEntity } from '../../entities/auth/user.entity';

export interface IAuthProviderRecord {
  userId: string;
  providerId: string;
  providerUserId: string | null;
}

export interface IUserRepository extends IBaseRepository<UserEntity, string> {
  findByEmail(email: string): Promise<UserEntity | null>;
  findByGuestDeviceId(deviceId: string): Promise<UserEntity | null>;
  deleteInactiveGuests(inactiveBefore: Date): Promise<number>;
  findByProviderUserId(
    providerId: string,
    providerUserId: string,
  ): Promise<UserEntity | null>;
  createWithProvider(
    userData: Partial<UserEntity>,
    providerId: string,
    providerUserId: string,
  ): Promise<UserEntity>;
  findAuthProvider(
    providerId: string,
    providerUserId: string,
  ): Promise<IAuthProviderRecord | null>;
  addAuthProvider(
    providerId: string,
    providerUserId: string,
    userId: string,
  ): Promise<void>;
}
