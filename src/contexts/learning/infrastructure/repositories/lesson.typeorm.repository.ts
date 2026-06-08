import { Repository } from 'typeorm';
import { LessonEntity } from 'src/contexts/shared/domain/entities/learning/lesson.entity';
import { ILessonRepository } from '../../domain/ports/lesson.repository.port';

export class LessonTypeOrmRepository implements ILessonRepository {
  constructor(private readonly repo: Repository<LessonEntity>) {}

  findAllByChapterId(chapterId: string): Promise<LessonEntity[]> {
    return this.repo.find({ where: { chapterId }, order: { order: 'ASC' } });
  }

  findByIdAndChapterId(
    id: string,
    chapterId: string,
  ): Promise<LessonEntity | null> {
    return this.repo.findOne({ where: { id, chapterId } });
  }

  async createMany(lessons: Partial<LessonEntity>[]): Promise<LessonEntity[]> {
    const entities = this.repo.create(lessons);
    return this.repo.save(entities);
  }
}
