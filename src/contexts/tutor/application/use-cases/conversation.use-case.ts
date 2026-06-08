import { Inject, Injectable } from '@nestjs/common';
import { TUTOR_UNIT_OF_WORK } from '../../domain/unit-of-work.interface';
import type { ITutorUnitOfWork } from '../../domain/unit-of-work.interface';
import { TUTOR_PDF_EXPORT_SERVICE } from '../../domain/ports/pdf-export.port';
import type { IPdfExportService } from '../../domain/ports/pdf-export.port';
import { NotImplementedError } from '../../domain/errors/not-implemented.error';
import type {
  IConversationUseCase,
  CreateConversationParams,
  UpdateConversationParams,
} from '../../domain/contracts/i-conversation.use-case';
import { TutorConversationEntity } from 'src/contexts/shared/domain/entities/tutor/tutor-conversation.entity';
import { ConversationNotFoundError } from '../../domain/errors/conversation-not-found.error';

@Injectable()
export class ConversationUseCase implements IConversationUseCase {
  constructor(
    @Inject(TUTOR_UNIT_OF_WORK)
    private readonly uow: ITutorUnitOfWork,
    @Inject(TUTOR_PDF_EXPORT_SERVICE)
    private readonly pdfExportService: IPdfExportService,
  ) {}

  list(userId: string): Promise<TutorConversationEntity[]> {
    return this.uow.conversations.findAllByUserId(userId);
  }

  create(params: CreateConversationParams): Promise<TutorConversationEntity> {
    return this.uow.conversations.create({
      userId: params.userId,
      title: params.title ?? null,
    });
  }

  async get(id: string, userId: string): Promise<TutorConversationEntity> {
    const conversation = await this.uow.conversations.findByIdAndUserId(
      id,
      userId,
    );
    if (!conversation) throw new ConversationNotFoundError();
    return conversation;
  }

  async update(
    params: UpdateConversationParams,
  ): Promise<TutorConversationEntity> {
    const existing = await this.uow.conversations.findByIdAndUserId(
      params.id,
      params.userId,
    );
    if (!existing) throw new ConversationNotFoundError();
    return this.uow.conversations.update(params.id, { title: params.title });
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.uow.conversations.findByIdAndUserId(id, userId);
    if (!existing) throw new ConversationNotFoundError();
    await this.uow.conversations.delete(id);
  }

  async exportPdf(conversationId: string, userId: string): Promise<Buffer> {
    const conversation = await this.uow.conversations.findByIdAndUserId(
      conversationId,
      userId,
    );
    if (!conversation) throw new ConversationNotFoundError();

    const messages =
      await this.uow.messages.findAllByConversationId(conversationId);

    return this.pdfExportService.generateConversationPdf(
      conversation.title,
      messages,
    );
  }

  generateAudio(): never {
    throw new NotImplementedError('Audio generation');
  }
}
