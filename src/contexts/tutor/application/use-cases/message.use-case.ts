import { Inject, Injectable } from '@nestjs/common';
import { TUTOR_UNIT_OF_WORK } from '../../domain/unit-of-work.interface';
import type { ITutorUnitOfWork } from '../../domain/unit-of-work.interface';
import { AI_TUTOR } from '../../domain/ports/ai-tutor.port';
import type { IAiTutor, ChatMessage } from '../../domain/ports/ai-tutor.port';
import type {
  IMessageUseCase,
  SendMessageParams,
} from '../../domain/contracts/i-message.use-case';
import { TutorMessageEntity } from 'src/contexts/shared/domain/entities/tutor/tutor-message.entity';
import { ConversationNotFoundError } from '../../domain/errors/conversation-not-found.error';
import { UNIT_OF_WORK } from 'src/contexts/shared/domain/repositories/unit-of-work.interface';
import type { IUnitOfWork } from 'src/contexts/shared/domain/repositories/unit-of-work.interface';
import {
  assertFeatureWithTrial,
  consumeTrialFeature,
} from 'src/contexts/shared/domain/utils/trial-usage.helper';

@Injectable()
export class MessageUseCase implements IMessageUseCase {
  constructor(
    @Inject(TUTOR_UNIT_OF_WORK)
    private readonly uow: ITutorUnitOfWork,
    @Inject(AI_TUTOR)
    private readonly aiTutor: IAiTutor,
    @Inject(UNIT_OF_WORK)
    private readonly sharedUow: IUnitOfWork,
  ) {}

  async list(
    conversationId: string,
    userId: string,
  ): Promise<TutorMessageEntity[]> {
    const conversation = await this.uow.conversations.findByIdAndUserId(
      conversationId,
      userId,
    );
    if (!conversation) throw new ConversationNotFoundError();
    return this.uow.messages.findAllByConversationId(conversationId);
  }

  async send(params: SendMessageParams): Promise<TutorMessageEntity> {
    const user = await this.sharedUow.users.findById(params.userId);
    if (user) {
      await assertFeatureWithTrial(this.sharedUow, user, 'tutor');
    }

    const conversation = await this.uow.conversations.findByIdAndUserId(
      params.conversationId,
      params.userId,
    );
    if (!conversation) throw new ConversationNotFoundError();

    const existingMessages = await this.uow.messages.findAllByConversationId(
      params.conversationId,
    );

    const history: ChatMessage[] = existingMessages.map((m) => ({
      role: m.role as 'user' | 'model',
      content: m.content,
    }));

    await this.uow.messages.create({
      conversationId: params.conversationId,
      role: 'user',
      content: params.content,
    });

    const [aiResponse, title] = await Promise.all([
      this.aiTutor.chat(history, params.content),
      existingMessages.length === 0
        ? this.aiTutor.generateTitle(params.content)
        : Promise.resolve(null),
    ]);

    const modelMessage = await this.uow.messages.create({
      conversationId: params.conversationId,
      role: 'model',
      content: aiResponse,
    });

    await this.uow.conversations.update(params.conversationId, title ? { title } : {});

    if (user) {
      await consumeTrialFeature(this.sharedUow, user, 'tutor');
    }

    return modelMessage;
  }
}
