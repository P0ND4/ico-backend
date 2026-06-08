import { DomainError } from 'src/contexts/shared/domain/errors/domain.error';

export class UserNotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor() {
    super('User not found.');
  }
}
