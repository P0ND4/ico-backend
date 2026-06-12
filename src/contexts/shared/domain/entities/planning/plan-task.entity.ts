import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { UserEntity } from '../auth/user.entity';

@Entity({ schema: 'trn', name: 'plan_tasks' })
export class PlanTaskEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 50, name: 'scheduled_time', nullable: true })
  scheduledTime!: string | null;

  @Column({ type: 'date', name: 'scheduled_date' })
  scheduledDate!: string;

  @Column({ type: 'boolean', name: 'is_completed', default: false })
  isCompleted!: boolean;

  @Column({ type: 'timestamptz', name: 'completed_at', nullable: true })
  completedAt!: Date | null;
}
