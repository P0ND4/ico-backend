import { Inject, Injectable } from '@nestjs/common';
import { PlanTaskEntity } from 'src/contexts/shared/domain/entities/planning/plan-task.entity';
import { PLANNING_UNIT_OF_WORK } from '../../domain/unit-of-work.interface';
import type { IPlanningUnitOfWork } from '../../domain/unit-of-work.interface';
import type {
  ITaskUseCase,
  ListTasksParams,
  CreateTaskParams,
  UpdateTaskParams,
} from '../../domain/contracts/i-task.use-case';
import { TaskNotFoundError } from '../../domain/errors/task-not-found.error';

@Injectable()
export class TaskUseCase implements ITaskUseCase {
  constructor(
    @Inject(PLANNING_UNIT_OF_WORK)
    private readonly uow: IPlanningUnitOfWork,
  ) {}

  list(params: ListTasksParams): Promise<PlanTaskEntity[]> {
    return this.uow.tasks.findAllByUserId(params.userId, params.date);
  }

  create(params: CreateTaskParams): Promise<PlanTaskEntity> {
    return this.uow.tasks.create(params);
  }

  async get(id: string, userId: string): Promise<PlanTaskEntity> {
    const task = await this.uow.tasks.findByIdAndUserId(id, userId);
    if (!task) throw new TaskNotFoundError();
    return task;
  }

  async update(params: UpdateTaskParams): Promise<PlanTaskEntity> {
    const { id, userId, isCompleted, ...rest } = params;

    const existing = await this.uow.tasks.findByIdAndUserId(id, userId);
    if (!existing) throw new TaskNotFoundError();

    const updateData: Partial<PlanTaskEntity> = { ...rest };

    if (isCompleted === true) {
      updateData.isCompleted = true;
      updateData.completedAt = new Date();
    } else if (isCompleted === false) {
      updateData.isCompleted = false;
      updateData.completedAt = null;
    }

    return this.uow.tasks.update(id, updateData);
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.uow.tasks.findByIdAndUserId(id, userId);
    if (!existing) throw new TaskNotFoundError();
    await this.uow.tasks.delete(id);
  }
}
