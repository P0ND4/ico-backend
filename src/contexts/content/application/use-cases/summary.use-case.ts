import { Inject, Injectable } from '@nestjs/common';
import { CONTENT_UNIT_OF_WORK } from '../../domain/unit-of-work.interface';
import type { IContentUnitOfWork } from '../../domain/unit-of-work.interface';
import { AI_SUMMARIZER } from '../../domain/ports/ai-summarizer.port';
import type { IAiSummarizer } from '../../domain/ports/ai-summarizer.port';
import { FILE_EXTRACTOR } from '../../domain/ports/file-extractor.port';
import type { IFileExtractor } from '../../domain/ports/file-extractor.port';
import { CONTENT_PDF_EXPORT_SERVICE } from '../../domain/ports/pdf-export.port';
import type { IContentPdfExportService } from '../../domain/ports/pdf-export.port';
import type {
  ISummaryUseCase,
  GenerateSummaryParams,
  UploadAndSummarizeParams,
  ExportSummaryParams,
  ExportSummaryResult,
} from '../../domain/contracts/i-summary.use-case';
import type { SummaryEntity } from 'src/contexts/shared/domain/entities/content/summary.entity';
import type { UserEntity } from 'src/contexts/shared/domain/entities/auth/user.entity';
import { SummaryNotFoundError } from '../../domain/errors/summary-not-found.error';
import { UNIT_OF_WORK } from 'src/contexts/shared/domain/repositories/unit-of-work.interface';
import type { IUnitOfWork } from 'src/contexts/shared/domain/repositories/unit-of-work.interface';
import {
  assertFeatureWithTrial,
  consumeTrialFeature,
} from 'src/contexts/shared/domain/utils/trial-usage.helper';
import { buildLearnerContextPrompt } from 'src/contexts/shared/domain/utils/learner-context.helper';

@Injectable()
export class SummaryUseCase implements ISummaryUseCase {
  constructor(
    @Inject(CONTENT_UNIT_OF_WORK)
    private readonly uow: IContentUnitOfWork,
    @Inject(AI_SUMMARIZER)
    private readonly aiSummarizer: IAiSummarizer,
    @Inject(FILE_EXTRACTOR)
    private readonly fileExtractor: IFileExtractor,
    @Inject(CONTENT_PDF_EXPORT_SERVICE)
    private readonly pdfExport: IContentPdfExportService,
    @Inject(UNIT_OF_WORK)
    private readonly sharedUow: IUnitOfWork,
  ) {}

  list(userId: string): Promise<SummaryEntity[]> {
    return this.uow.summaries.findAllByUserId(userId);
  }

  async generate(params: GenerateSummaryParams): Promise<SummaryEntity> {
    const user = await this.checkSummaryPlan(params.userId);
    const learnerContext = user ? buildLearnerContextPrompt(user) : null;
    const summaryText = await this.aiSummarizer.summarize(
      params.text,
      learnerContext ?? undefined,
    );
    const summary = await this.uow.summaries.create({
      userId: params.userId,
      originalText: params.text,
      summaryText,
      sourceType: 'text',
    });
    await this.consumeSummaryTrial(user);
    return summary;
  }

  async uploadAndSummarize(
    params: UploadAndSummarizeParams,
  ): Promise<SummaryEntity> {
    const user = await this.checkSummaryPlan(params.userId);
    const extractedText = await this.fileExtractor.extract(
      params.buffer,
      params.mimeType,
      params.originalname,
    );

    const learnerContext = user ? buildLearnerContextPrompt(user) : null;
    const summaryText = await this.aiSummarizer.summarize(
      extractedText,
      learnerContext ?? undefined,
    );

    const ext = params.originalname.split('.').pop()?.toLowerCase();
    const sourceType = ext === 'pdf' ? 'pdf' : ext === 'docx' ? 'docx' : 'txt';

    const summary = await this.uow.summaries.create({
      userId: params.userId,
      originalText: extractedText,
      summaryText,
      sourceFilename: params.originalname,
      sourceType,
    });
    await this.consumeSummaryTrial(user);
    return summary;
  }

  async get(id: string, userId: string): Promise<SummaryEntity> {
    const summary = await this.uow.summaries.findByIdAndUserId(id, userId);
    if (!summary) throw new SummaryNotFoundError();
    return summary;
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.uow.summaries.findByIdAndUserId(id, userId);
    if (!existing) throw new SummaryNotFoundError();
    await this.uow.summaries.delete(id);
  }

  async export(params: ExportSummaryParams): Promise<ExportSummaryResult> {
    const summary = await this.uow.summaries.findByIdAndUserId(
      params.summaryId,
      params.userId,
    );
    if (!summary) throw new SummaryNotFoundError();

    if (params.format === 'pdf') {
      const buffer = await this.pdfExport.generateSummaryPdf(summary);
      return {
        buffer,
        mimeType: 'application/pdf',
        filename: `summary-${params.summaryId}.pdf`,
      };
    }

    if (params.format === 'docx') {
      const buffer = await this.pdfExport.generateSummaryDocx(summary);
      return {
        buffer,
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        filename: `summary-${params.summaryId}.docx`,
      };
    }

    return {
      buffer: Buffer.from(this.pdfExport.generateSummaryTxt(summary), 'utf-8'),
      mimeType: 'text/plain',
      filename: `summary-${params.summaryId}.txt`,
    };
  }

  private async checkSummaryPlan(userId: string): Promise<UserEntity | null> {
    const user = await this.sharedUow.users.findById(userId);
    if (user) {
      await assertFeatureWithTrial(this.sharedUow, user, 'summary');
    }
    return user;
  }

  private async consumeSummaryTrial(user: UserEntity | null): Promise<void> {
    if (user) {
      await consumeTrialFeature(this.sharedUow, user, 'summary');
    }
  }
}
