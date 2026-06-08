import { DomainError } from 'src/contexts/shared/domain/errors/domain.error';

export class ConversationNotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor() {
    super('Conversation not found');
  }
}
