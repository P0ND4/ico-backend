import { TutorMessageEntity } from 'src/contexts/shared/domain/entities/tutor/tutor-message.entity';

export interface ITutorMessageRepository {
  findAllByConversationId(
    conversationId: string,
  ): Promise<TutorMessageEntity[]>;
  create(data: Partial<TutorMessageEntity>): Promise<TutorMessageEntity>;
}
