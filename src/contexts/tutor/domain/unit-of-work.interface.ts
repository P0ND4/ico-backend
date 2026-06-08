import type { ITutorConversationRepository } from './ports/tutor-conversation.repository.port';
import type { ITutorMessageRepository } from './ports/tutor-message.repository.port';

export const TUTOR_UNIT_OF_WORK = Symbol('TUTOR_UNIT_OF_WORK');

export interface ITutorUnitOfWork {
  readonly conversations: ITutorConversationRepository;
  readonly messages: ITutorMessageRepository;
  withTransaction<R>(fn: (uow: ITutorUnitOfWork) => Promise<R>): Promise<R>;
}
