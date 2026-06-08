import type { SummaryEntity } from 'src/contexts/shared/domain/entities/content/summary.entity';

export const SUMMARY_USE_CASE = Symbol('SUMMARY_USE_CASE');

export type ExportFormat = 'pdf' | 'txt' | 'docx';

export interface ExportSummaryResult {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}

export interface GenerateSummaryParams {
  userId: string;
  text: string;
}

export interface UploadAndSummarizeParams {
  userId: string;
  buffer: Buffer;
  mimeType: string;
  originalname: string;
}

export interface ExportSummaryParams {
  summaryId: string;
  userId: string;
  format: ExportFormat;
}

export interface ISummaryUseCase {
  list(userId: string): Promise<SummaryEntity[]>;
  generate(params: GenerateSummaryParams): Promise<SummaryEntity>;
  uploadAndSummarize(params: UploadAndSummarizeParams): Promise<SummaryEntity>;
  get(id: string, userId: string): Promise<SummaryEntity>;
  delete(id: string, userId: string): Promise<void>;
  export(params: ExportSummaryParams): Promise<ExportSummaryResult>;
}
