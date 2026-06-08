import type { PathListItemType } from '../../domain/types/path.types';

export class PathListItemDto implements PathListItemType {
  id!: string;
  title!: string;
  description!: string | null;
  mode!: string;
  status!: string;
  totalXp!: number;
  earnedXp!: number;
  chapterCount!: number;
  completedChapterCount!: number;
  createdAt!: Date;
}
