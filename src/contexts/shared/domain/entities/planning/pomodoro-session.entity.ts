import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../auth/user.entity';
import { PlanTaskEntity } from './plan-task.entity';

@Entity({ schema: 'trn', name: 'pomodoro_sessions' })
export class PomodoroSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'uuid', name: 'task_id', nullable: true })
  taskId!: string | null;

  @ManyToOne(() => PlanTaskEntity, { nullable: true })
  @JoinColumn({ name: 'task_id' })
  task!: PlanTaskEntity | null;

  @Column({ type: 'int', name: 'duration_minutes' })
  durationMinutes!: number;

  @Column({ type: 'boolean', name: 'is_completed', default: false })
  isCompleted!: boolean;

  @Column({ type: 'timestamptz', name: 'started_at' })
  startedAt!: Date;

  @Column({ type: 'timestamptz', name: 'completed_at', nullable: true })
  completedAt!: Date | null;
}
