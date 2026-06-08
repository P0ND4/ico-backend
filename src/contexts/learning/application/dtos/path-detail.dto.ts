import type { PathDetailType } from '../../domain/types/path.types';
import { PathListItemDto } from './path-list-item.dto';
import { ChapterSummaryDto } from './chapter-summary.dto';

export class PathDetailDto extends PathListItemDto implements PathDetailType {
  topic!: string;
  chapters!: ChapterSummaryDto[];
}
