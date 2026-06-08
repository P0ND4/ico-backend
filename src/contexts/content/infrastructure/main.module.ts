import { Module } from '@nestjs/common';
import { SummariesModule } from './http-api/v1/summaries/summaries.module';

@Module({
  imports: [SummariesModule],
})
export class ContentModule {}
