export const EXAM_USE_CASE = 'EXAM_USE_CASE';

export interface EvaluateExamParams {
  chapterId: string;
  userId: string;
  answers: Array<{ lessonId: string; text: string }>;
}

export interface ExamFeedback {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface EvaluateExamResult {
  score: number;
  passed: boolean;
  feedback: ExamFeedback;
}

export interface IExamUseCase {
  evaluate(params: EvaluateExamParams): Promise<EvaluateExamResult>;
}
