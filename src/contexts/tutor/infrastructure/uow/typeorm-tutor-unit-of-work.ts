import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { TutorConversationEntity } from 'src/contexts/shared/domain/entities/tutor/tutor-conversation.entity';
import { TutorMessageEntity } from 'src/contexts/shared/domain/entities/tutor/tutor-message.entity';
import { TutorConversationTypeOrmRepository } from '../repositories/tutor-conversation.typeorm.repository';
import { TutorMessageTypeOrmRepository } from '../repositories/tutor-message.typeorm.repository';
import type { ITutorUnitOfWork } from '../../domain/unit-of-work.interface';
import type { ITutorConversationRepository } from '../../domain/ports/tutor-conversation.repository.port';
import type { ITutorMessageRepository } from '../../domain/ports/tutor-message.repository.port';

@Injectable()
export class TypeOrmTutorUnitOfWork implements ITutorUnitOfWork {
  readonly conversations: ITutorConversationRepository;
  readonly messages: ITutorMessageRepository;

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(TutorConversationEntity)
    convRepo: Repository<TutorConversationEntity>,
    @InjectRepository(TutorMessageEntity)
    msgRepo: Repository<TutorMessageEntity>,
  ) {
    this.conversations = new TutorConversationTypeOrmRepository(convRepo);
    this.messages = new TutorMessageTypeOrmRepository(msgRepo);
  }

  async withTransaction<R>(
    fn: (uow: ITutorUnitOfWork) => Promise<R>,
  ): Promise<R> {
    return this.dataSource.transaction((manager) =>
      fn(this.buildTransactional(manager)),
    );
  }

  private buildTransactional(manager: EntityManager): ITutorUnitOfWork {
    const tx: ITutorUnitOfWork = {
      conversations: new TutorConversationTypeOrmRepository(
        manager.getRepository(TutorConversationEntity),
      ),
      messages: new TutorMessageTypeOrmRepository(
        manager.getRepository(TutorMessageEntity),
      ),
      withTransaction: <T>(innerFn: (uow: ITutorUnitOfWork) => Promise<T>) =>
        innerFn(tx),
    };
    return tx;
  }
}
