import type { TagEntity } from 'src/contexts/shared/domain/entities/catalog/tag.entity';
import type { XpLevelEntity } from 'src/contexts/shared/domain/entities/config/xp-level.entity';
import type { SubscriptionPlanEntity } from 'src/contexts/shared/domain/entities/config/subscription-plan.entity';

export const CATALOG_USE_CASE = Symbol('CATALOG_USE_CASE');

export interface ICatalogUseCase {
  listTags(): Promise<TagEntity[]>;
  listXpLevels(): Promise<XpLevelEntity[]>;
  listSubscriptionPlans(): Promise<SubscriptionPlanEntity[]>;
}
