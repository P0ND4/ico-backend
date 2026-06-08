import { Repository } from 'typeorm';
import { LessonAnswerEntity } from 'src/contexts/shared/domain/entities/learning/lesson-answer.entity';
import { ILessonAnswerRepository } from '../../domain/ports/lesson-answer.repository.port';

export class LessonAnswerTypeOrmRepository implements ILessonAnswerRepository {
  constructor(private readonly repo: Repository<LessonAnswerEntity>) {}

  async create(data: Partial<LessonAnswerEntity>): Promise<LessonAnswerEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }
}
