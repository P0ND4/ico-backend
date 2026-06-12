import { DomainError } from 'src/contexts/shared/domain/errors/domain.error';

export class ExamNotPassedError extends DomainError {
  readonly statusCode = 403;

  constructor() {
    super('Exam chapter requires a passing exam result before completion');
  }
}
