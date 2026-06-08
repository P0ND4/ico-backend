import { Injectable } from '@nestjs/common';
import * as pdfParseModule from 'pdf-parse';
import mammoth from 'mammoth';
const pdfParse = (pdfParseModule as any).default ?? pdfParseModule;
import { IFileExtractor } from '../../domain/ports/file-extractor.port';
import { UnsupportedFileTypeError } from '../../domain/errors/unsupported-file-type.error';

@Injectable()
export class FileExtractorService implements IFileExtractor {
  async extract(
    buffer: Buffer,
    mimeType: string,
    originalname: string,
  ): Promise<string> {
    const ext = originalname.split('.').pop()?.toLowerCase();

    if (mimeType === 'application/pdf' || ext === 'pdf') {
      const data = await pdfParse(buffer);
      return data.text;
    }

    if (
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      ext === 'docx'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    if (mimeType === 'text/plain' || ext === 'txt' || ext === 'text') {
      return buffer.toString('utf-8');
    }

    throw new UnsupportedFileTypeError();
  }
}
