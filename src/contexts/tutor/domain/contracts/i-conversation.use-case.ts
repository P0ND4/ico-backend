import type { TutorConversationEntity } from 'src/contexts/shared/domain/entities/tutor/tutor-conversation.entity';

export const CONVERSATION_USE_CASE = Symbol('CONVERSATION_USE_CASE');

export interface CreateConversationParams {
  userId: string;
  title?: string;
}

export interface UpdateConversationParams {
  id: string;
  userId: string;
  title: string;
}

export interface IConversationUseCase {
  list(userId: string): Promise<TutorConversationEntity[]>;
  create(params: CreateConversationParams): Promise<TutorConversationEntity>;
  get(id: string, userId: string): Promise<TutorConversationEntity>;
  update(params: UpdateConversationParams): Promise<TutorConversationEntity>;
  delete(id: string, userId: string): Promise<void>;
  exportPdf(conversationId: string, userId: string): Promise<Buffer>;
  generateAudio(): never;
}
