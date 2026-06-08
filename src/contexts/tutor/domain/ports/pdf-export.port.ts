export const TUTOR_PDF_EXPORT_SERVICE = Symbol('TUTOR_PDF_EXPORT_SERVICE');

export interface IPdfExportService {
  generateConversationPdf(
    title: string | null,
    messages: Array<{ role: string; content: string; createdAt: Date }>,
  ): Promise<Buffer>;
}
