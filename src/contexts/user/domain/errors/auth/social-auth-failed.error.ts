import { DomainError } from 'src/contexts/shared/domain/errors/domain.error';

export class SocialAuthFailedError extends DomainError {
  readonly statusCode = 401;

  constructor(message = 'Social authentication failed') {
    super(message);
  }
}
