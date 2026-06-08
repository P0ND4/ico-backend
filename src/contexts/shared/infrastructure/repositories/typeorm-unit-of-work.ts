import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { UserEntity } from '../../domain/entities/auth/user.entity';
import { UserAuthProviderEntity } from '../../domain/entities/auth/user-auth-provider.entity';
import { UserStatsEntity } from '../../domain/entities/auth/user-stats.entity';
import { UserTypeOrmRepository } from './auth/user.typeorm.repository';
import { UserStatsTypeOrmRepository } from './auth/user-stats.typeorm.repository';
import type { IUnitOfWork } from '../../domain/repositories/unit-of-work.interface';
import type { IUserRepository } from '../../domain/repositories/auth/user.repository.interface';
import type { IUserStatsRepository } from '../../domain/repositories/auth/user-stats.repository.interface';

@Injectable()
export class TypeOrmUnitOfWork implements IUnitOfWork {
  readonly users: IUserRepository;
  readonly userStats: IUserStatsRepository;

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(UserEntity) userRepo: Repository<UserEntity>,
    @InjectRepository(UserAuthProviderEntity)
    authProviderRepo: Repository<UserAuthProviderEntity>,
    @InjectRepository(UserStatsEntity)
    userStatsRepo: Repository<UserStatsEntity>,
  ) {
    this.users = new UserTypeOrmRepository(
      userRepo,
      authProviderRepo,
      dataSource,
    );
    this.userStats = new UserStatsTypeOrmRepository(userStatsRepo);
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
      withTransaction: <T>(innerFn: (uow: IUnitOfWork) => Promise<T>) =>
        innerFn(tx),
    };
    return tx;
  }
}
