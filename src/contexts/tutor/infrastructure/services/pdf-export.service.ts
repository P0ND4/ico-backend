import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { marked } from 'marked';
import { IPdfExportService } from '../../domain/ports/pdf-export.port';

function stripInline(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/gs, '$1')
    .replace(/__(.*?)__/gs, '$1')
    .replace(/\*(.*?)\*/gs, '$1')
    .replace(/_(.*?)_/gs, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/~~(.*?)~~/gs, '$1');
}

function renderMarkdown(doc: PDFKit.PDFDocument, text: string): void {
  const tokens = marked.lexer(text);
  for (const token of tokens) {
    if (token.type === 'heading') {
      const sizes: Record<number, number> = { 1: 16, 2: 14, 3: 13 };
      doc.font('Helvetica-Bold').fontSize(sizes[token.depth] ?? 12).fillColor('#000000')
        .text(stripInline(token.text)).moveDown(0.3);
      doc.font('Helvetica').fontSize(12);
    } else if (token.type === 'paragraph') {
      doc.font('Helvetica').fontSize(12).fillColor('#000000')
        .text(stripInline(token.text)).moveDown(0.3);
    } else if (token.type === 'list') {
      let idx = 1;
      for (const item of token.items) {
        const prefix = token.ordered ? `${idx++}.` : '•';
        doc.font('Helvetica').fontSize(12).fillColor('#000000')
          .text(`${prefix}  ${stripInline(item.text)}`, { indent: 16 }).moveDown(0.15);
      }
      doc.moveDown(0.2);
    } else if (token.type === 'code') {
      doc.font('Courier').fontSize(10).fillColor('#333333')
        .text(token.text, { indent: 16 }).moveDown(0.3);
      doc.font('Helvetica').fontSize(12).fillColor('#000000');
    } else if (token.type === 'blockquote') {
      doc.font('Helvetica-Oblique').fontSize(12).fillColor('#555555')
        .text(stripInline(token.text ?? ''), { indent: 24 }).moveDown(0.3);
      doc.font('Helvetica').fillColor('#000000');
    }
  }
}

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

      doc.font('Helvetica-Bold').fontSize(20).text(title ?? 'Tutor Conversation', { align: 'center' });
      doc.moveDown();

      for (const msg of messages) {
        const label = msg.role === 'user' ? 'Tú' : 'Tutor';
        const time = new Date(msg.createdAt).toLocaleString('es-AR');
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#666666').text(`${label} · ${time}`);
        doc.moveDown(0.2);

        if (msg.role === 'model') {
          renderMarkdown(doc, msg.content);
        } else {
          doc.font('Helvetica').fontSize(12).fillColor('#000000').text(msg.content);
        }
        doc.moveDown(0.6);
      }

      doc.end();
    });
  }
}
