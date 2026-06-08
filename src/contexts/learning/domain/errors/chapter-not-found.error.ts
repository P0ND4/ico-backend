import { DomainError } from 'src/contexts/shared/domain/errors/domain.error';

export class ChapterNotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor() {
    super('Chapter not found');
  }
}
