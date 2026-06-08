import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../auth/user.entity';
import { LessonEntity } from './lesson.entity';

@Entity({ schema: 'trn', name: 'lesson_answers' })
export class LessonAnswerEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'uuid', name: 'lesson_id' })
  lessonId!: string;

  @ManyToOne(() => LessonEntity)
  @JoinColumn({ name: 'lesson_id' })
  lesson!: LessonEntity;

  @Column({ type: 'int', name: 'selected_index', nullable: true })
  selectedIndex!: number | null;

  @Column({ type: 'boolean', name: 'selected_answer', nullable: true })
  selectedAnswer!: boolean | null;

  @Column({ type: 'boolean', name: 'is_correct' })
  isCorrect!: boolean;

  @Column({ type: 'int', name: 'points_earned', default: 0 })
  pointsEarned!: number;

  @Column({ type: 'timestamptz', name: 'answered_at', default: () => 'NOW()' })
  answeredAt!: Date;
}
