import { DomainError } from 'src/contexts/shared/domain/errors/domain.error';

export class ChapterLockedError extends DomainError {
  readonly statusCode = 403;

  constructor() {
    super('Chapter is locked');
  }
}
