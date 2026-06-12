import { Repository } from 'typeorm';
import { TutorConversationEntity } from 'src/contexts/shared/domain/entities/tutor/tutor-conversation.entity';
import { TutorMessageEntity } from 'src/contexts/shared/domain/entities/tutor/tutor-message.entity';
import { ITutorConversationRepository } from '../../domain/ports/tutor-conversation.repository.port';

export class TutorConversationTypeOrmRepository implements ITutorConversationRepository {
  constructor(private readonly repo: Repository<TutorConversationEntity>) {}

  findAllByUserId(userId: string): Promise<TutorConversationEntity[]> {
    return this.repo
      .createQueryBuilder('c')
      .innerJoin(TutorMessageEntity, 'm', 'm.conversationId = c.id')
      .where('c.userId = :userId', { userId })
      .orderBy('c.updatedAt', 'DESC')
      .getMany();
  }

  findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<TutorConversationEntity | null> {
    return this.repo.findOne({ where: { id, userId } });
  }

  async create(
    data: Partial<TutorConversationEntity>,
  ): Promise<TutorConversationEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(
    id: string,
    data: Partial<TutorConversationEntity>,
  ): Promise<TutorConversationEntity> {
    const entity = await this.repo.findOneOrFail({ where: { id } });
    Object.assign(entity, data);
    return this.repo.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }
}
