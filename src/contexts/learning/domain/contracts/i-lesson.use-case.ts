import type { LessonAnswerEntity } from 'src/contexts/shared/domain/entities/learning/lesson-answer.entity';

export const LESSON_USE_CASE = Symbol('LESSON_USE_CASE');

export interface RecordAnswerParams {
  pathId: string;
  chapterId: string;
  lessonId: string;
  userId: string;
  selectedIndex?: number;
  selectedAnswer?: boolean;
  isCorrect: boolean;
}

export interface RecordAnswerResult {
  lessonAnswer: LessonAnswerEntity;
}

export interface ILessonUseCase {
  recordAnswer(params: RecordAnswerParams): Promise<RecordAnswerResult>;
}
