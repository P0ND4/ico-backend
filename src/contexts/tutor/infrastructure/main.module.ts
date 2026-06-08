import { Module } from '@nestjs/common';
import { TutorConversationsModule } from './http-api/v1/conversations/tutor-conversations.module';

@Module({
  imports: [TutorConversationsModule],
})
export class TutorModule {}
