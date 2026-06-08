import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagEntity } from 'src/contexts/shared/domain/entities/catalog/tag.entity';
import { XpLevelEntity } from 'src/contexts/shared/domain/entities/config/xp-level.entity';
import { CATALOG_UNIT_OF_WORK } from 'src/contexts/catalog/domain/unit-of-work.interface';
import { CATALOG_USE_CASE } from 'src/contexts/catalog/domain/contracts/i-catalog.use-case';
import { TypeOrmCatalogUnitOfWork } from '../../uow/typeorm-catalog-unit-of-work';
import { CatalogUseCase } from 'src/contexts/catalog/application/use-cases/catalog.use-case';
import { CatalogController } from './catalog/controllers/catalog.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TagEntity, XpLevelEntity])],
  controllers: [CatalogController],
  providers: [
    {
      provide: CATALOG_UNIT_OF_WORK,
      useClass: TypeOrmCatalogUnitOfWork,
    },
    { provide: CATALOG_USE_CASE, useClass: CatalogUseCase },
  ],
})
export class CatalogModule {}
