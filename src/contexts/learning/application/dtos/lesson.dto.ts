import type { LessonType } from '../../domain/types/path.types';

export class LessonDto implements LessonType {
  id!: string;
  chapterId!: string;
  type!: string;
  title!: string | null;
  content!: string;
  question!: string | null;
  options!: string[] | null;
  correctIndex!: number | null;
  correctAnswer!: boolean | null;
  points!: number;
  order!: number;
  createdAt!: Date;
}
