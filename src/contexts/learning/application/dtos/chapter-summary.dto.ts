import type { ChapterSummaryType } from '../../domain/types/path.types';

export class ChapterSummaryDto implements ChapterSummaryType {
  id!: string;
  title!: string;
  order!: number;
  status!: string;
  maxXp!: number;
  earnedXp!: number;
  completedAt!: Date | null;
}
