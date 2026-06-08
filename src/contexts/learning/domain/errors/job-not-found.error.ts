import { DomainError } from 'src/contexts/shared/domain/errors/domain.error';

export class JobNotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor() {
    super('Path generation job not found');
  }
}
