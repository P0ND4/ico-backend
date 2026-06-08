import { DomainError } from 'src/contexts/shared/domain/errors/domain.error';

export class SummaryNotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor() {
    super('Summary not found');
  }
}
