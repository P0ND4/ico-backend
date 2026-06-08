import { DomainError } from 'src/contexts/shared/domain/errors/domain.error';

export class UserInactiveError extends DomainError {
  readonly statusCode = 401;

  constructor(message = 'User account is inactive') {
    super(message);
  }
}
