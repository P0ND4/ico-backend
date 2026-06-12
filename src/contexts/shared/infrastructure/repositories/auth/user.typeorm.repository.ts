import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserEntity } from '../../../domain/entities/auth/user.entity';
import { UserAuthProviderEntity } from '../../../domain/entities/auth/user-auth-provider.entity';
import {
  IAuthProviderRecord,
  IUserRepository,
} from '../../../domain/repositories/auth/user.repository.interface';
import { BaseTypeOrmRepository } from '../base-typeorm.repository';

@Injectable()
export class UserTypeOrmRepository
  extends BaseTypeOrmRepository<UserEntity, string>
  implements IUserRepository
{
  constructor(
    @InjectRepository(UserEntity)
    repository: Repository<UserEntity>,
    @InjectRepository(UserAuthProviderEntity)
    private readonly authProviderRepo: Repository<UserAuthProviderEntity>,
    private readonly dataSource: DataSource,
  ) {
    super(repository);
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.repository.findOne({ where: { email } });
  }

  findByGuestDeviceId(deviceId: string): Promise<UserEntity | null> {
    return this.repository.findOne({ where: { guestDeviceId: deviceId } });
  }

  async deleteInactiveGuests(inactiveBefore: Date): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('email IS NULL')
      .andWhere(
        '(last_active_at IS NULL OR last_active_at < :cutoff)',
        { cutoff: inactiveBefore },
      )
      .execute();
    return result.affected ?? 0;
  }

  async findByProviderUserId(
    providerId: string,
    providerUserId: string,
  ): Promise<UserEntity | null> {
    const provider = await this.authProviderRepo.findOne({
      where: { providerId, providerUserId },
      relations: { user: true },
    });
    return provider?.user ?? null;
  }

  async createWithProvider(
    userData: Partial<UserEntity>,
    providerId: string,
    providerUserId: string,
  ): Promise<UserEntity> {
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(UserEntity);
      const providerRepo = manager.getRepository(UserAuthProviderEntity);

      const user = await userRepo.save(userRepo.create(userData));

      const authProvider = providerRepo.create({
        userId: user.id,
        providerId,
        providerUserId,
      });
      await providerRepo.save(authProvider);

      return user;
    });
  }

  async findAuthProvider(
    providerId: string,
    providerUserId: string,
  ): Promise<IAuthProviderRecord | null> {
    const record = await this.authProviderRepo.findOne({
      where: { providerId, providerUserId },
    });
    if (!record) return null;
    return {
      userId: record.userId,
      providerId: record.providerId,
      providerUserId: record.providerUserId,
    };
  }

  async addAuthProvider(
    providerId: string,
    providerUserId: string,
    userId: string,
  ): Promise<void> {
    const authProvider = this.authProviderRepo.create({
      userId,
      providerId,
      providerUserId,
    });
    await this.authProviderRepo.save(authProvider);
  }
}
