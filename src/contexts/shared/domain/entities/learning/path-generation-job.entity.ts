import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LearningPathEntity } from './learning-path.entity';
import { JobStatusEntity } from '../catalog/job-status.entity';

@Entity({ schema: 'trn', name: 'path_generation_jobs' })
export class PathGenerationJobEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'path_id' })
  pathId!: string;

  @OneToOne(() => LearningPathEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'path_id' })
  path!: LearningPathEntity;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: string;

  @ManyToOne(() => JobStatusEntity, { eager: false })
  @JoinColumn({ name: 'status', referencedColumnName: 'code' })
  jobStatus!: JobStatusEntity;

  @Column({ type: 'int', default: 0 })
  progress!: number;

  @Column({ type: 'text', name: 'progress_label', nullable: true })
  progressLabel!: string | null;

  @Column({ type: 'text', name: 'error_msg', nullable: true })
  errorMsg!: string | null;

  @Column({ type: 'timestamptz', name: 'started_at', nullable: true })
  startedAt!: Date | null;

  @Column({ type: 'timestamptz', name: 'finished_at', nullable: true })
  finishedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
