export const FILE_EXTRACTOR = Symbol('FILE_EXTRACTOR');

export interface IFileExtractor {
  extract(
    buffer: Buffer,
    mimeType: string,
    originalname: string,
  ): Promise<string>;
}
