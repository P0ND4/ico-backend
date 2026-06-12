import { LearningPathEntity } from 'src/contexts/shared/domain/entities/learning/learning-path.entity';

export interface ILearningPathRepository {
  findAllByUserId(userId: string): Promise<LearningPathEntity[]>;
  findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<LearningPathEntity | null>;
  countActiveByUserId(userId: string): Promise<number>;
  create(data: Partial<LearningPathEntity>): Promise<LearningPathEntity>;
  update(
    id: string,
    data: Partial<LearningPathEntity>,
  ): Promise<LearningPathEntity>;
  delete(id: string): Promise<void>;
}
