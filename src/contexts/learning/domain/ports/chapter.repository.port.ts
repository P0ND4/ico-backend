import { ChapterEntity } from 'src/contexts/shared/domain/entities/learning/chapter.entity';

export interface IChapterRepository {
  findAllByPathId(pathId: string): Promise<ChapterEntity[]>;
  findByIdAndPathId(id: string, pathId: string): Promise<ChapterEntity | null>;
  findByPathIdAndOrder(
    pathId: string,
    order: number,
  ): Promise<ChapterEntity | null>;
  createMany(chapters: Partial<ChapterEntity>[]): Promise<ChapterEntity[]>;
  update(id: string, data: Partial<ChapterEntity>): Promise<ChapterEntity>;
}
