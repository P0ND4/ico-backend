import type { ChapterDetailType } from '../../domain/types/path.types';
import { LessonDto } from './lesson.dto';

export class ChapterDetailDto implements ChapterDetailType {
  id!: string;
  pathId!: string;
  title!: string;
  order!: number;
  status!: string;
  maxXp!: number;
  earnedXp!: number;
  correctAnswers!: number;
  totalQuestions!: number;
  completedAt!: Date | null;
  createdAt!: Date;
  lessons!: LessonDto[];
}
