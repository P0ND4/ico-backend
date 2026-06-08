import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity({ schema: 'trn', name: 'user_stats' })
export class UserStatsEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @OneToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'int', name: 'total_study_minutes', default: 0 })
  totalStudyMinutes!: number;

  @Column({ type: 'int', name: 'paths_completed', default: 0 })
  pathsCompleted!: number;

  @Column({ type: 'int', name: 'chapters_completed', default: 0 })
  chaptersCompleted!: number;

  @Column({ type: 'int', name: 'lessons_completed', default: 0 })
  lessonsCompleted!: number;

  @Column({ type: 'int', name: 'correct_answers', default: 0 })
  correctAnswers!: number;

  @Column({ type: 'int', name: 'total_question_answers', default: 0 })
  totalQuestionAnswers!: number;

  @Column({ type: 'int', name: 'pomodoro_sessions_done', default: 0 })
  pomodoroSessionsDone!: number;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
