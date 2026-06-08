import { Repository } from 'typeorm';
import { SummaryEntity } from 'src/contexts/shared/domain/entities/content/summary.entity';
import { ISummaryRepository } from '../../domain/ports/summary.repository.port';

export class SummaryTypeOrmRepository implements ISummaryRepository {
  constructor(private readonly repo: Repository<SummaryEntity>) {}

  findAllByUserId(userId: string): Promise<SummaryEntity[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  findByIdAndUserId(id: string, userId: string): Promise<SummaryEntity | null> {
    return this.repo.findOne({ where: { id, userId } });
  }

  async create(data: Partial<SummaryEntity>): Promise<SummaryEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }
}
