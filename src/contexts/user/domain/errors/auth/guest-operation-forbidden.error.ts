import { DomainError } from 'src/contexts/shared/domain/errors/domain.error';

export class GuestOperationForbiddenError extends DomainError {
  readonly statusCode = 403;

  constructor() {
    super('This operation is not available for guest accounts.');
  }
}
