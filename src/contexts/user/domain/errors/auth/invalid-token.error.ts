import { DomainError } from 'src/contexts/shared/domain/errors/domain.error';

export class InvalidTokenError extends DomainError {
  readonly statusCode = 401;

  constructor(message = 'Invalid or expired token') {
    super(message);
  }
}
