import { Module } from '@nestjs/common';
import { PathsModule } from './http-api/v1/paths/paths.module';
import { ChaptersModule } from './http-api/v1/chapters/chapters.module';
import { LessonsModule } from './http-api/v1/lessons/lessons.module';

@Module({
  imports: [PathsModule, ChaptersModule, LessonsModule],
})
export class LearningModule {}
