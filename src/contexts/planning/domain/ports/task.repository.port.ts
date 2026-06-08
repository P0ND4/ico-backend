import { PlanTaskEntity } from 'src/contexts/shared/domain/entities/planning/plan-task.entity';

export interface ITaskRepository {
  findAllByUserId(userId: string, date?: string): Promise<PlanTaskEntity[]>;
  findByIdAndUserId(id: string, userId: string): Promise<PlanTaskEntity | null>;
  create(data: Partial<PlanTaskEntity>): Promise<PlanTaskEntity>;
  update(id: string, data: Partial<PlanTaskEntity>): Promise<PlanTaskEntity>;
  delete(id: string): Promise<void>;
}
