import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { UserEntity } from '../auth/user.entity';
import { PathModeEntity } from '../catalog/path-mode.entity';
import { PathStatusEntity } from '../catalog/path-status.entity';

@Entity({ schema: 'trn', name: 'learning_paths' })
export class LearningPathEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  topic!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'standard' })
  mode!: string;

  @ManyToOne(() => PathModeEntity, { eager: false })
  @JoinColumn({ name: 'mode', referencedColumnName: 'code' })
  pathMode!: PathModeEntity;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: string;

  @ManyToOne(() => PathStatusEntity, { eager: false })
  @JoinColumn({ name: 'status', referencedColumnName: 'code' })
  pathStatus!: PathStatusEntity;

  @Column({ type: 'int', name: 'total_xp', default: 0 })
  totalXp!: number;

  @Column({ type: 'int', name: 'earned_xp', default: 0 })
  earnedXp!: number;
}
