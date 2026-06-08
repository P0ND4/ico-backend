import { DomainError } from 'src/contexts/shared/domain/errors/domain.error';

export class PathNotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor() {
    super('Learning path not found');
  }
}
