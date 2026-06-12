import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { UserEntity } from '../auth/user.entity';
import { ChapterEntity } from './chapter.entity';

@Entity({ schema: 'trn', name: 'exam_results' })
@Unique(['userId', 'chapterId'])
export class ExamResultEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'uuid', name: 'chapter_id' })
  chapterId!: string;

  @ManyToOne(() => ChapterEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chapter_id' })
  chapter!: ChapterEntity;

  @Column({ type: 'int', default: 0 })
  score!: number;

  @Column({ type: 'boolean', default: false })
  passed!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  feedback!: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  } | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
