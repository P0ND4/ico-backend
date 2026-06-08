import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SummaryEntity } from 'src/contexts/shared/domain/entities/content/summary.entity';
import { CONTENT_UNIT_OF_WORK } from 'src/contexts/content/domain/unit-of-work.interface';
import { AI_SUMMARIZER } from 'src/contexts/content/domain/ports/ai-summarizer.port';
import { FILE_EXTRACTOR } from 'src/contexts/content/domain/ports/file-extractor.port';
import { CONTENT_PDF_EXPORT_SERVICE } from 'src/contexts/content/domain/ports/pdf-export.port';
import { SUMMARY_USE_CASE } from 'src/contexts/content/domain/contracts/i-summary.use-case';
import { TypeOrmContentUnitOfWork } from 'src/contexts/content/infrastructure/uow/typeorm-content-unit-of-work';
import { DeepseekSummarizerService } from 'src/contexts/content/infrastructure/services/deepseek-summarizer.service';
import { FileExtractorService } from 'src/contexts/content/infrastructure/services/file-extractor.service';
import { ContentPdfExportService } from 'src/contexts/content/infrastructure/services/pdf-export.service';
import { SummaryUseCase } from 'src/contexts/content/application/use-cases/summary.use-case';
import { SummariesController } from './controllers/summaries.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SummaryEntity]), ConfigModule],
  controllers: [SummariesController],
  providers: [
    {
      provide: CONTENT_UNIT_OF_WORK,
      useClass: TypeOrmContentUnitOfWork,
    },
    {
      provide: AI_SUMMARIZER,
      useClass: DeepseekSummarizerService,
    },
    { provide: FILE_EXTRACTOR, useClass: FileExtractorService },
    {
      provide: CONTENT_PDF_EXPORT_SERVICE,
      useClass: ContentPdfExportService,
    },
    { provide: SUMMARY_USE_CASE, useClass: SummaryUseCase },
  ],
})
export class SummariesModule {}
