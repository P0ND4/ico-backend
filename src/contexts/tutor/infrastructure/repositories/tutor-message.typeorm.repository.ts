import { Repository } from 'typeorm';
import { TutorMessageEntity } from 'src/contexts/shared/domain/entities/tutor/tutor-message.entity';
import { ITutorMessageRepository } from '../../domain/ports/tutor-message.repository.port';

export class TutorMessageTypeOrmRepository implements ITutorMessageRepository {
  constructor(private readonly repo: Repository<TutorMessageEntity>) {}

  findAllByConversationId(
    conversationId: string,
  ): Promise<TutorMessageEntity[]> {
    return this.repo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
  }

  async create(data: Partial<TutorMessageEntity>): Promise<TutorMessageEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }
}
