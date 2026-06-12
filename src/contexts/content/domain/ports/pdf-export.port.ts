import type { SummaryEntity } from 'src/contexts/shared/domain/entities/content/summary.entity';

export const CONTENT_PDF_EXPORT_SERVICE = Symbol('CONTENT_PDF_EXPORT_SERVICE');

export interface IContentPdfExportService {
  generateSummaryPdf(summary: SummaryEntity): Promise<Buffer>;
  generateSummaryDocx(summary: SummaryEntity): Promise<Buffer>;
  generateSummaryTxt(summary: SummaryEntity): string;
}
