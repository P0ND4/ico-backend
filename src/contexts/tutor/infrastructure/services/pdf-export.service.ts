import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { IPdfExportService } from '../../domain/ports/pdf-export.port';

@Injectable()
export class PdfExportService implements IPdfExportService {
  async generateConversationPdf(
    title: string | null,
    messages: Array<{ role: string; content: string; createdAt: Date }>,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).text(title ?? 'Tutor Conversation', { align: 'center' });
      doc.moveDown();

      for (const msg of messages) {
        const label = msg.role === 'user' ? 'You' : 'Tutor';
        const time = msg.createdAt.toISOString();
        doc.fontSize(10).fillColor('#888888').text(`${label} · ${time}`);
        doc.fontSize(12).fillColor('#000000').text(msg.content);
        doc.moveDown(0.5);
      }

      doc.end();
    });
  }
}
