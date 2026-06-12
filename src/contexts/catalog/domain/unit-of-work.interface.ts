import type { ITagRepository } from './ports/tag.repository.port';
import type { IXpLevelRepository } from 'src/contexts/shared/domain/repositories/config/xp-level.repository.interface';
import type { ISubscriptionPlanRepository } from 'src/contexts/shared/domain/repositories/config/subscription-plan.repository.interface';

export const CATALOG_UNIT_OF_WORK = 'CATALOG_UNIT_OF_WORK';

export interface ICatalogUnitOfWork {
  readonly tags: ITagRepository;
  readonly xpLevels: IXpLevelRepository;
  readonly subscriptionPlans: ISubscriptionPlanRepository;
  withTransaction<R>(fn: (uow: ICatalogUnitOfWork) => Promise<R>): Promise<R>;
}
