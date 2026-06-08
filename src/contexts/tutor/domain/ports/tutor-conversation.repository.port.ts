import { TutorConversationEntity } from 'src/contexts/shared/domain/entities/tutor/tutor-conversation.entity';

export interface ITutorConversationRepository {
  findAllByUserId(userId: string): Promise<TutorConversationEntity[]>;
  findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<TutorConversationEntity | null>;
  create(
    data: Partial<TutorConversationEntity>,
  ): Promise<TutorConversationEntity>;
  update(
    id: string,
    data: Partial<TutorConversationEntity>,
  ): Promise<TutorConversationEntity>;
  delete(id: string): Promise<void>;
}
