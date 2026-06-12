import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { LearningPathEntity } from './learning-path.entity';
import { ChapterStatusEntity } from '../catalog/chapter-status.entity';

@Entity({ schema: 'trn', name: 'chapters' })
@Unique(['pathId', 'order'])
export class ChapterEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'path_id' })
  pathId!: string;

  @ManyToOne(() => LearningPathEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'path_id' })
  path!: LearningPathEntity;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'int' })
  order!: number;

  @Column({ type: 'varchar', length: 50, default: 'locked' })
  status!: string;

  @ManyToOne(() => ChapterStatusEntity, { eager: false })
  @JoinColumn({ name: 'status', referencedColumnName: 'code' })
  chapterStatus!: ChapterStatusEntity;

  @Column({ type: 'int', name: 'max_xp', default: 0 })
  maxXp!: number;

  @Column({ type: 'int', name: 'earned_xp', default: 0 })
  earnedXp!: number;

  @Column({ type: 'int', name: 'correct_answers', default: 0 })
  correctAnswers!: number;

  @Column({ type: 'int', name: 'total_questions', default: 0 })
  totalQuestions!: number;

  @Column({ type: 'timestamptz', name: 'completed_at', nullable: true })
  completedAt!: Date | null;

  @Column({ type: 'boolean', name: 'is_exam', default: false })
  isExam!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
