export const AI_SUMMARIZER = Symbol('AI_SUMMARIZER');

export interface IAiSummarizer {
  summarize(text: string): Promise<string>;
}
