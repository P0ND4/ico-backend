import { DomainError } from 'src/contexts/shared/domain/errors/domain.error';

export class TaskNotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor() {
    super('Task not found');
  }
}
