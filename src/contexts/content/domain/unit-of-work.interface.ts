import type { ISummaryRepository } from './ports/summary.repository.port';

export const CONTENT_UNIT_OF_WORK = 'CONTENT_UNIT_OF_WORK';

export interface IContentUnitOfWork {
  readonly summaries: ISummaryRepository;
  withTransaction<R>(fn: (uow: IContentUnitOfWork) => Promise<R>): Promise<R>;
}
