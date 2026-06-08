import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserStatsEntity } from 'src/contexts/shared/domain/entities/auth/user-stats.entity';
import type { IUserStatsRepository } from 'src/contexts/shared/domain/repositories/auth/user-stats.repository.interface';

@Injectable()
export class UserStatsTypeOrmRepository implements IUserStatsRepository {
  constructor(
    @InjectRepository(UserStatsEntity)
    private readonly repo: Repository<UserStatsEntity>,
  ) {}

  findByUserId(userId: string): Promise<UserStatsEntity | null> {
    return this.repo.findOne({ where: { userId } });
  }

  save(entity: UserStatsEntity): Promise<UserStatsEntity> {
    return this.repo.save(entity);
  }

  create(data: Partial<UserStatsEntity>): Promise<UserStatsEntity> {
    return this.repo.save(this.repo.create(data));
  }
}
