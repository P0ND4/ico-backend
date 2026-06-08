import { DomainError } from 'src/contexts/shared/domain/errors/domain.error';

export class UnsupportedFileTypeError extends DomainError {
  readonly statusCode = 400;

  constructor() {
    super('Unsupported file type');
  }
}
