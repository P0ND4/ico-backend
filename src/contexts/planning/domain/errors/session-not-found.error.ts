import { DomainError } from 'src/contexts/shared/domain/errors/domain.error';

export class SessionNotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor() {
    super('Pomodoro session not found');
  }
}
