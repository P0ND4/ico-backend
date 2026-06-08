import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ChapterEntity } from './chapter.entity';

@Entity({ schema: 'trn', name: 'lessons' })
@Unique(['chapterId', 'order'])
export class LessonEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'chapter_id' })
  chapterId!: string;

  @ManyToOne(() => ChapterEntity)
  @JoinColumn({ name: 'chapter_id' })
  chapter!: ChapterEntity;

  @Column({ type: 'varchar', length: 50 })
  type!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title!: string | null;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'text', nullable: true })
  question!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  options!: string[] | null;

  @Column({ type: 'int', name: 'correct_index', nullable: true })
  correctIndex!: number | null;

  @Column({ type: 'boolean', name: 'correct_answer', nullable: true })
  correctAnswer!: boolean | null;

  @Column({ type: 'int', default: 0 })
  points!: number;

  @Column({ type: 'int' })
  order!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
