import { Repository } from 'typeorm';
import { PlanTaskEntity } from 'src/contexts/shared/domain/entities/planning/plan-task.entity';
import { ITaskRepository } from '../../domain/ports/task.repository.port';

export class TaskTypeOrmRepository implements ITaskRepository {
  constructor(private readonly repo: Repository<PlanTaskEntity>) {}

  async findAllByUserId(
    userId: string,
    date?: string,
  ): Promise<PlanTaskEntity[]> {
    const qb = this.repo
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId })
      .orderBy('task.scheduledDate', 'ASC')
      .addOrderBy('task.scheduledTime', 'ASC', 'NULLS LAST');

    if (date) {
      qb.andWhere('task.scheduledDate = :date', { date });
    }

    return qb.getMany();
  }

  findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<PlanTaskEntity | null> {
    return this.repo.findOne({ where: { id, userId } });
  }

  async create(data: Partial<PlanTaskEntity>): Promise<PlanTaskEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(
    id: string,
    data: Partial<PlanTaskEntity>,
  ): Promise<PlanTaskEntity> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
