import type { UserStatsEntity } from 'src/contexts/shared/domain/entities/auth/user-stats.entity';

export interface IUserStatsRepository {
  findByUserId(userId: string): Promise<UserStatsEntity | null>;
  save(entity: UserStatsEntity): Promise<UserStatsEntity>;
  create(data: Partial<UserStatsEntity>): Promise<UserStatsEntity>;
  deleteByUserId(userId: string): Promise<void>;
}
