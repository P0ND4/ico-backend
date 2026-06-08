export const AI_TUTOR = Symbol('AI_TUTOR');

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface IAiTutor {
  chat(history: ChatMessage[], userMessage: string): Promise<string>;
}
