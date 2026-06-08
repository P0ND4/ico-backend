import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TagEntity } from 'src/contexts/shared/domain/entities/catalog/tag.entity';
import { XpLevelEntity } from 'src/contexts/shared/domain/entities/config/xp-level.entity';
import { TagTypeOrmRepository } from '../repositories/tag.typeorm.repository';
import { XpLevelTypeOrmRepository } from 'src/contexts/shared/infrastructure/repositories/config/xp-level.typeorm.repository';
import type { ICatalogUnitOfWork } from '../../domain/unit-of-work.interface';
import type { ITagRepository } from '../../domain/ports/tag.repository.port';
import type { IXpLevelRepository } from 'src/contexts/shared/domain/repositories/config/xp-level.repository.interface';

@Injectable()
export class TypeOrmCatalogUnitOfWork implements ICatalogUnitOfWork {
  readonly tags: ITagRepository;
  readonly xpLevels: IXpLevelRepository;

  constructor(
    @InjectRepository(TagEntity) tagRepo: Repository<TagEntity>,
    @InjectRepository(XpLevelEntity) xpRepo: Repository<XpLevelEntity>,
  ) {
    this.tags = new TagTypeOrmRepository(tagRepo);
    this.xpLevels = new XpLevelTypeOrmRepository(xpRepo);
  }

  async withTransaction<R>(
    fn: (uow: ICatalogUnitOfWork) => Promise<R>,
  ): Promise<R> {
    // Read-only context — no transaction needed
    return fn(this);
  }
}
