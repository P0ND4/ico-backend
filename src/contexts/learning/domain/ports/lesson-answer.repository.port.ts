import { LessonAnswerEntity } from 'src/contexts/shared/domain/entities/learning/lesson-answer.entity';

export interface ILessonAnswerRepository {
  create(data: Partial<LessonAnswerEntity>): Promise<LessonAnswerEntity>;
}
