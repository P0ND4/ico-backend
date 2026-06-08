import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { SummaryEntity } from 'src/contexts/shared/domain/entities/content/summary.entity';
import { SummaryTypeOrmRepository } from '../repositories/summary.typeorm.repository';
import type { IContentUnitOfWork } from '../../domain/unit-of-work.interface';
import type { ISummaryRepository } from '../../domain/ports/summary.repository.port';

@Injectable()
export class TypeOrmContentUnitOfWork implements IContentUnitOfWork {
  readonly summaries: ISummaryRepository;

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(SummaryEntity) summaryRepo: Repository<SummaryEntity>,
  ) {
    this.summaries = new SummaryTypeOrmRepository(summaryRepo);
  }

  async withTransaction<R>(
    fn: (uow: IContentUnitOfWork) => Promise<R>,
  ): Promise<R> {
    return this.dataSource.transaction((manager) =>
      fn(this.buildTransactional(manager)),
    );
  }

  private buildTransactional(manager: EntityManager): IContentUnitOfWork {
    const tx: IContentUnitOfWork = {
      summaries: new SummaryTypeOrmRepository(
        manager.getRepository(SummaryEntity),
      ),
      withTransaction: <T>(innerFn: (uow: IContentUnitOfWork) => Promise<T>) =>
        innerFn(tx),
    };
    return tx;
  }
}
