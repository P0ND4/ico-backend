import { LessonEntity } from 'src/contexts/shared/domain/entities/learning/lesson.entity';

export interface ILessonRepository {
  findAllByChapterId(chapterId: string): Promise<LessonEntity[]>;
  findByIdAndChapterId(
    id: string,
    chapterId: string,
  ): Promise<LessonEntity | null>;
  createMany(lessons: Partial<LessonEntity>[]): Promise<LessonEntity[]>;
}
