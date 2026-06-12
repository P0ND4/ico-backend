import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse');
import mammoth from 'mammoth';
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
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      return result.text;
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
