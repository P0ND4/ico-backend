import { Repository } from 'typeorm';
import { ChapterEntity } from 'src/contexts/shared/domain/entities/learning/chapter.entity';
import { IChapterRepository } from '../../domain/ports/chapter.repository.port';

export class ChapterTypeOrmRepository implements IChapterRepository {
  constructor(private readonly repo: Repository<ChapterEntity>) {}

  findAllByPathId(pathId: string): Promise<ChapterEntity[]> {
    return this.repo.find({ where: { pathId }, order: { order: 'ASC' } });
  }

  findByIdAndPathId(id: string, pathId: string): Promise<ChapterEntity | null> {
    return this.repo.findOne({ where: { id, pathId } });
  }

  findByPathIdAndOrder(
    pathId: string,
    order: number,
  ): Promise<ChapterEntity | null> {
    return this.repo.findOne({ where: { pathId, order } });
  }

  async createMany(
    chapters: Partial<ChapterEntity>[],
  ): Promise<ChapterEntity[]> {
    const entities = this.repo.create(chapters);
    return this.repo.save(entities);
  }

  async update(
    id: string,
    data: Partial<ChapterEntity>,
  ): Promise<ChapterEntity> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }
}
