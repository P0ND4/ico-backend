import { DomainError } from 'src/contexts/shared/domain/errors/domain.error';

export class NotImplementedError extends DomainError {
  readonly statusCode = 501;

  constructor(feature: string) {
    super(`${feature} is not yet implemented`);
  }
}
