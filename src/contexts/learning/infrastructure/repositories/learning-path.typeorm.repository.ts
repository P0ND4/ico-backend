import { Repository } from 'typeorm';
import { LearningPathEntity } from 'src/contexts/shared/domain/entities/learning/learning-path.entity';
import { ILearningPathRepository } from '../../domain/ports/learning-path.repository.port';

export class LearningPathTypeOrmRepository implements ILearningPathRepository {
  constructor(private readonly repo: Repository<LearningPathEntity>) {}

  findAllByUserId(userId: string): Promise<LearningPathEntity[]> {
    return this.repo.find({ where: { userId } });
  }

  findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<LearningPathEntity | null> {
    return this.repo.findOne({ where: { id, userId } });
  }

  async create(data: Partial<LearningPathEntity>): Promise<LearningPathEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(
    id: string,
    data: Partial<LearningPathEntity>,
  ): Promise<LearningPathEntity> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
