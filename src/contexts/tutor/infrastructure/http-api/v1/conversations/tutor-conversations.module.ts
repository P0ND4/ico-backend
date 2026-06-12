import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TutorConversationEntity } from 'src/contexts/shared/domain/entities/tutor/tutor-conversation.entity';
import { TutorMessageEntity } from 'src/contexts/shared/domain/entities/tutor/tutor-message.entity';
import { SharedModule } from 'src/contexts/shared/shared.module';
import { TUTOR_UNIT_OF_WORK } from 'src/contexts/tutor/domain/unit-of-work.interface';
import { AI_TUTOR } from 'src/contexts/tutor/domain/ports/ai-tutor.port';
import { TUTOR_PDF_EXPORT_SERVICE } from 'src/contexts/tutor/domain/ports/pdf-export.port';
import { CONVERSATION_USE_CASE } from 'src/contexts/tutor/domain/contracts/i-conversation.use-case';
import { MESSAGE_USE_CASE } from 'src/contexts/tutor/domain/contracts/i-message.use-case';
import { TypeOrmTutorUnitOfWork } from 'src/contexts/tutor/infrastructure/uow/typeorm-tutor-unit-of-work';
import { DeepseekTutorService } from 'src/contexts/tutor/infrastructure/services/deepseek-tutor.service';
import { PdfExportService } from 'src/contexts/tutor/infrastructure/services/pdf-export.service';
import { ConversationUseCase } from 'src/contexts/tutor/application/use-cases/conversation.use-case';
import { MessageUseCase } from 'src/contexts/tutor/application/use-cases/message.use-case';
import { TutorConversationsController } from './controllers/tutor-conversations.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TutorConversationEntity, TutorMessageEntity]),
    ConfigModule,
    SharedModule,
  ],
  controllers: [TutorConversationsController],
  providers: [
    { provide: TUTOR_UNIT_OF_WORK, useClass: TypeOrmTutorUnitOfWork },
    { provide: AI_TUTOR, useClass: DeepseekTutorService },
    { provide: TUTOR_PDF_EXPORT_SERVICE, useClass: PdfExportService },
    {
      provide: CONVERSATION_USE_CASE,
      useClass: ConversationUseCase,
    },
    { provide: MESSAGE_USE_CASE, useClass: MessageUseCase },
  ],
})
export class TutorConversationsModule {}
