import type { PlanTaskEntity } from 'src/contexts/shared/domain/entities/planning/plan-task.entity';

export const TASK_USE_CASE = Symbol('TASK_USE_CASE');

export interface ListTasksParams {
  userId: string;
  date?: string;
}

export interface CreateTaskParams {
  userId: string;
  title: string;
  scheduledDate: string;
  scheduledTime?: string;
}

export interface UpdateTaskParams {
  id: string;
  userId: string;
  title?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  isCompleted?: boolean;
}

export interface ITaskUseCase {
  list(params: ListTasksParams): Promise<PlanTaskEntity[]>;
  create(params: CreateTaskParams): Promise<PlanTaskEntity>;
  get(id: string, userId: string): Promise<PlanTaskEntity>;
  update(params: UpdateTaskParams): Promise<PlanTaskEntity>;
  delete(id: string, userId: string): Promise<void>;
}
