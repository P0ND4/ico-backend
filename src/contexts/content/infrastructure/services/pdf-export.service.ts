import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { marked } from 'marked';
import type { SummaryEntity } from 'src/contexts/shared/domain/entities/content/summary.entity';
import type { IContentPdfExportService } from '../../domain/ports/pdf-export.port';

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

function buildRuns(tokens: any[]): TextRun[] {
  const runs: TextRun[] = [];
  for (const t of tokens) {
    if (t.type === 'strong') {
      runs.push(new TextRun({ text: t.text, bold: true }));
    } else if (t.type === 'em') {
      runs.push(new TextRun({ text: t.text, italics: true }));
    } else if (t.type === 'codespan') {
      runs.push(new TextRun({ text: t.text, font: 'Courier New' }));
    } else if (t.type === 'text' && t.tokens?.length) {
      runs.push(...buildRuns(t.tokens));
    } else if (t.type === 'softbreak' || t.type === 'br') {
      runs.push(new TextRun({ break: 1 }));
    } else {
      runs.push(new TextRun({ text: t.text ?? t.raw ?? '' }));
    }
  }
  return runs;
}

function getItemInlineTokens(item: any): any[] {
  const firstBlock = item.tokens?.[0];
  if (!firstBlock) return [{ type: 'text', text: item.text ?? '' }];
  return firstBlock.tokens?.length ? firstBlock.tokens : [firstBlock];
}

const HEADING_LEVELS: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
  5: HeadingLevel.HEADING_5,
  6: HeadingLevel.HEADING_6,
};

const PDF_HEADING_SIZES: Record<number, number> = { 1: 22, 2: 18, 3: 15, 4: 13, 5: 12, 6: 12 };

@Injectable()
export class ContentPdfExportService implements IContentPdfExportService {
  generateSummaryPdf(summary: SummaryEntity): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const tokens = marked.lexer(summary.summaryText);

      for (const token of tokens) {
        if (token.type === 'heading') {
          const size = PDF_HEADING_SIZES[token.depth] ?? 12;
          doc.font('Helvetica-Bold').fontSize(size).text(stripInline(token.text)).moveDown(0.4);
          doc.font('Helvetica').fontSize(12);
        } else if (token.type === 'paragraph') {
          doc.font('Helvetica').fontSize(12).text(stripInline(token.text)).moveDown(0.5);
        } else if (token.type === 'list') {
          let idx = 1;
          for (const item of token.items) {
            const prefix = token.ordered ? `${idx++}.` : '•';
            doc
              .font('Helvetica')
              .fontSize(12)
              .text(`${prefix}  ${stripInline(item.text)}`, { indent: 20 })
              .moveDown(0.2);
          }
          doc.moveDown(0.3);
        } else if (token.type === 'code') {
          doc.font('Courier').fontSize(10).text(token.text, { indent: 20 }).moveDown(0.5);
          doc.font('Helvetica').fontSize(12);
        } else if (token.type === 'blockquote') {
          doc
            .font('Helvetica-Oblique')
            .fontSize(12)
            .text(stripInline(token.text ?? ''), { indent: 30 })
            .moveDown(0.5);
          doc.font('Helvetica');
        } else if (token.type === 'hr') {
          doc.moveDown(0.5);
        }
      }

      doc.end();
    });
  }

  async generateSummaryDocx(summary: SummaryEntity): Promise<Buffer> {
    const tokens = marked.lexer(summary.summaryText);
    const children: Paragraph[] = [];

    for (const token of tokens) {
      if (token.type === 'heading') {
        children.push(
          new Paragraph({
            text: token.text,
            heading: HEADING_LEVELS[token.depth] ?? HeadingLevel.HEADING_1,
            spacing: { after: 160 },
          }),
        );
      } else if (token.type === 'paragraph') {
        const runs = buildRuns(token.tokens ?? []);
        children.push(new Paragraph({ children: runs, spacing: { after: 160 } }));
      } else if (token.type === 'list') {
        for (const item of token.items) {
          const runs = buildRuns(getItemInlineTokens(item));
          children.push(
            new Paragraph({
              children: runs,
              bullet: { level: 0 },
              spacing: { after: 80 },
            }),
          );
        }
        children.push(new Paragraph({ text: '', spacing: { after: 80 } }));
      } else if (token.type === 'code') {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: token.text, font: 'Courier New', size: 18 })],
            spacing: { after: 160 },
          }),
        );
      } else if (token.type === 'blockquote') {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: stripInline(token.text ?? ''), italics: true })],
            indent: { left: 720 },
            spacing: { after: 160 },
          }),
        );
      }
    }

    const doc = new Document({ sections: [{ children }] });
    return Packer.toBuffer(doc);
  }

  generateSummaryTxt(summary: SummaryEntity): string {
    return summary.summaryText
      .replace(/^#{1,6}\s+(.+)$/gm, '$1')
      .replace(/\*\*(.*?)\*\*/gs, '$1')
      .replace(/__(.*?)__/gs, '$1')
      .replace(/\*(.*?)\*/gs, '$1')
      .replace(/_(.*?)_/gs, '$1')
      .replace(/```[\s\S]*?```/g, (m) => m.replace(/```\w*\n?/g, '').trim())
      .replace(/`(.*?)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/~~(.*?)~~/gs, '$1')
      .replace(/^>\s*/gm, '  ')
      .replace(/^\s*[-*+]\s+/gm, '• ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
