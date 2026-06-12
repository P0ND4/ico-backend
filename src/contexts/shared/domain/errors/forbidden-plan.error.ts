import { DomainError } from './domain.error';

export class ForbiddenPlanError extends DomainError {
  readonly statusCode = 403;

  constructor(readonly reason: string) {
    super(`Your current plan does not allow this action: ${reason}`);
  }
}
