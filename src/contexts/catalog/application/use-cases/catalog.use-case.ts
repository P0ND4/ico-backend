import { Inject, Injectable } from '@nestjs/common';
import { TagEntity } from 'src/contexts/shared/domain/entities/catalog/tag.entity';
import { XpLevelEntity } from 'src/contexts/shared/domain/entities/config/xp-level.entity';
import { CATALOG_UNIT_OF_WORK } from '../../domain/unit-of-work.interface';
import type { ICatalogUnitOfWork } from '../../domain/unit-of-work.interface';
import type { ICatalogUseCase } from '../../domain/contracts/i-catalog.use-case';

@Injectable()
export class CatalogUseCase implements ICatalogUseCase {
  constructor(
    @Inject(CATALOG_UNIT_OF_WORK)
    private readonly uow: ICatalogUnitOfWork,
  ) {}

  listTags(): Promise<TagEntity[]> {
    return this.uow.tags.findAll();
  }

  listXpLevels(): Promise<XpLevelEntity[]> {
    return this.uow.xpLevels.findAll();
  }

  listSubscriptionPlans() {
    return this.uow.subscriptionPlans.findAll();
  }
}
