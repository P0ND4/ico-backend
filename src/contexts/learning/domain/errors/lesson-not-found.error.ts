import { DomainError } from 'src/contexts/shared/domain/errors/domain.error';

export class LessonNotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor() {
    super('Lesson not found');
  }
}
