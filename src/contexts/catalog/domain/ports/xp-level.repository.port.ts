import { XpLevelEntity } from 'src/contexts/shared/domain/entities/config/xp-level.entity';

export interface IXpLevelRepository {
  findAll(): Promise<XpLevelEntity[]>;
}
