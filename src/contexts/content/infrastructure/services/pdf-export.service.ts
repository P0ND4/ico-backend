import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type { SummaryEntity } from 'src/contexts/shared/domain/entities/content/summary.entity';
import type { IContentPdfExportService } from '../../domain/ports/pdf-export.port';

@Injectable()
export class ContentPdfExportService implements IContentPdfExportService {
  generateSummaryPdf(summary: SummaryEntity): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.fontSize(18).text('Summary', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(summary.summaryText);
      doc.end();
    });
  }
}
