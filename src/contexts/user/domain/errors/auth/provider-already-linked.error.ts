import { DomainError } from 'src/contexts/shared/domain/errors/domain.error';

export class ProviderAlreadyLinkedError extends DomainError {
  readonly statusCode = 409;

  constructor() {
    super('This social account is already linked to a different user.');
  }
}
