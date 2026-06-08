import type { TutorMessageEntity } from 'src/contexts/shared/domain/entities/tutor/tutor-message.entity';

export const MESSAGE_USE_CASE = Symbol('MESSAGE_USE_CASE');

export interface SendMessageParams {
  conversationId: string;
  userId: string;
  content: string;
}

export interface IMessageUseCase {
  list(conversationId: string, userId: string): Promise<TutorMessageEntity[]>;
  send(params: SendMessageParams): Promise<TutorMessageEntity>;
}
