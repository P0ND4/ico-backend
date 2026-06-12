import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { UserEntity } from '../../domain/entities/auth/user.entity';
import { UserAuthProviderEntity } from '../../domain/entities/auth/user-auth-provider.entity';
import { UserStatsEntity } from '../../domain/entities/auth/user-stats.entity';
import { XpLevelEntity } from '../../domain/entities/config/xp-level.entity';
import { SubscriptionPlanEntity } from '../../domain/entities/config/subscription-plan.entity';
import { DeviceTrialEntity } from '../../domain/entities/auth/device-trial.entity';
import { UserPlanQuotaEntity } from '../../domain/entities/auth/user-plan-quota.entity';
import { UserTypeOrmRepository } from './auth/user.typeorm.repository';
import { DeviceTrialTypeOrmRepository } from './auth/device-trial.typeorm.repository';
import { UserPlanQuotaTypeOrmRepository } from './auth/user-plan-quota.typeorm.repository';
import { UserStatsTypeOrmRepository } from './auth/user-stats.typeorm.repository';
import { XpLevelTypeOrmRepository } from './config/xp-level.typeorm.repository';
import { SubscriptionPlanTypeOrmRepository } from './config/subscription-plan.typeorm.repository';
import type { IUnitOfWork } from '../../domain/repositories/unit-of-work.interface';
import type { IUserRepository } from '../../domain/repositories/auth/user.repository.interface';
import type { IUserStatsRepository } from '../../domain/repositories/auth/user-stats.repository.interface';
import type { IXpLevelRepository } from '../../domain/repositories/config/xp-level.repository.interface';
import type { ISubscriptionPlanRepository } from '../../domain/repositories/config/subscription-plan.repository.interface';
import type { IDeviceTrialRepository } from '../../domain/repositories/auth/device-trial.repository.interface';
import type { IUserPlanQuotaRepository } from '../../domain/repositories/auth/user-plan-quota.repository.interface';

@Injectable()
export class TypeOrmUnitOfWork implements IUnitOfWork {
  readonly users: IUserRepository;
  readonly userStats: IUserStatsRepository;
  readonly xpLevels: IXpLevelRepository;
  readonly subscriptionPlans: ISubscriptionPlanRepository;
  readonly deviceTrials: IDeviceTrialRepository;
  readonly userPlanQuotas: IUserPlanQuotaRepository;

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(UserEntity) userRepo: Repository<UserEntity>,
    @InjectRepository(UserAuthProviderEntity)
    authProviderRepo: Repository<UserAuthProviderEntity>,
    @InjectRepository(UserStatsEntity)
    userStatsRepo: Repository<UserStatsEntity>,
    @InjectRepository(XpLevelEntity)
    xpLevelRepo: Repository<XpLevelEntity>,
    @InjectRepository(SubscriptionPlanEntity)
    subscriptionPlanRepo: Repository<SubscriptionPlanEntity>,
    @InjectRepository(DeviceTrialEntity)
    deviceTrialRepo: Repository<DeviceTrialEntity>,
    @InjectRepository(UserPlanQuotaEntity)
    userPlanQuotaRepo: Repository<UserPlanQuotaEntity>,
  ) {
    this.users = new UserTypeOrmRepository(
      userRepo,
      authProviderRepo,
      dataSource,
    );
    this.userStats = new UserStatsTypeOrmRepository(userStatsRepo);
    this.xpLevels = new XpLevelTypeOrmRepository(xpLevelRepo);
    this.subscriptionPlans = new SubscriptionPlanTypeOrmRepository(subscriptionPlanRepo);
    this.deviceTrials = new DeviceTrialTypeOrmRepository(deviceTrialRepo);
    this.userPlanQuotas = new UserPlanQuotaTypeOrmRepository(userPlanQuotaRepo);
  }

  async withTransaction<R>(fn: (uow: IUnitOfWork) => Promise<R>): Promise<R> {
    return this.dataSource.transaction((manager) =>
      fn(this.buildTransactional(manager)),
    );
  }

  private buildTransactional(manager: EntityManager): IUnitOfWork {
    const tx: IUnitOfWork = {
      users: new UserTypeOrmRepository(
        manager.getRepository(UserEntity),
        manager.getRepository(UserAuthProviderEntity),
        this.dataSource,
      ),
      userStats: new UserStatsTypeOrmRepository(
        manager.getRepository(UserStatsEntity),
      ),
      xpLevels: new XpLevelTypeOrmRepository(
        manager.getRepository(XpLevelEntity),
      ),
      subscriptionPlans: new SubscriptionPlanTypeOrmRepository(
        manager.getRepository(SubscriptionPlanEntity),
      ),
      deviceTrials: new DeviceTrialTypeOrmRepository(
        manager.getRepository(DeviceTrialEntity),
      ),
      userPlanQuotas: new UserPlanQuotaTypeOrmRepository(
        manager.getRepository(UserPlanQuotaEntity),
      ),
      withTransaction: <T>(innerFn: (uow: IUnitOfWork) => Promise<T>) =>
        innerFn(tx),
    };
    return tx;
  }
}
