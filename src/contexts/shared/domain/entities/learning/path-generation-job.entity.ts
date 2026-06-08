import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LearningPathEntity } from './learning-path.entity';

@Entity({ schema: 'trn', name: 'path_generation_jobs' })
export class PathGenerationJobEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'path_id' })
  pathId!: string;

  @OneToOne(() => LearningPathEntity)
  @JoinColumn({ name: 'path_id' })
  path!: LearningPathEntity;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: string;

  @Column({ type: 'text', name: 'error_msg', nullable: true })
  errorMsg!: string | null;

  @Column({ type: 'timestamptz', name: 'started_at', nullable: true })
  startedAt!: Date | null;

  @Column({ type: 'timestamptz', name: 'finished_at', nullable: true })
  finishedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
