import type { ChapterDetailType } from '../types/path.types';
import type { ChapterEntity } from 'src/contexts/shared/domain/entities/learning/chapter.entity';

export const CHAPTER_USE_CASE = Symbol('CHAPTER_USE_CASE');

export interface CompleteChapterParams {
  pathId: string;
  chapterId: string;
  userId: string;
  earnedXp: number;
  correctCount: number;
  totalQuestions: number;
}

export interface CompleteChapterResult {
  chapter: ChapterEntity;
  nextChapterUnlocked: boolean;
  pathCompleted: boolean;
}

export interface IChapterUseCase {
  get(
    pathId: string,
    chapterId: string,
    userId: string,
  ): Promise<ChapterDetailType>;
  complete(params: CompleteChapterParams): Promise<CompleteChapterResult>;
}
