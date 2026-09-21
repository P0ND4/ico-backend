import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { XpLevelEntity } from '../config/xp-level.entity';

@Entity({ schema: 'trn', name: 'users' })
export class UserEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name!: string | null;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email!: string | null;

  @Column({ type: 'text', name: 'avatar_url', nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'int', default: 0 })
  xp!: number;

  @Column({ type: 'int', default: 1 })
  level!: number;

  @ManyToOne(() => XpLevelEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'level', referencedColumnName: 'level' })
  xpLevel!: XpLevelEntity | null;

  @Column({ type: 'int', name: 'streak_days', default: 0 })
  streakDays!: number;

  @Column({ type: 'timestamptz', name: 'last_active_at', nullable: true })
  lastActiveAt!: Date | null;

  @Column({ name: 'plan_code', type: 'varchar', length: 50, default: 'free' })
  planCode!: string;

  @Column({
    type: 'varchar',
    length: 36,
    name: 'guest_device_id',
    nullable: true,
    unique: true,
  })
  guestDeviceId!: string | null;

  @Column({
    type: 'varchar',
    length: 64,
    name: 'device_id',
    nullable: true,
  })
  deviceId!: string | null;

  @Column({ type: 'boolean', name: 'is_vip', default: false })
  isVip!: boolean;

  /** NULL while `isVip` = true means a permanent VIP grant. */
  @Column({ type: 'timestamptz', name: 'vip_expires_at', nullable: true })
  vipExpiresAt!: Date | null;

  /** NULL means the current `planCode` does not expire. */
  @Column({ type: 'timestamptz', name: 'plan_expires_at', nullable: true })
  planExpiresAt!: Date | null;

  /** Plan to fall back to when a coupon-granted `plan_upgrade` expires. */
  @Column({
    name: 'base_plan_code',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  basePlanCode!: string | null;

  @Column({
    type: 'varchar',
    length: 10,
    name: 'theme_mode',
    default: 'system',
  })
  themeMode!: string;

  @Column({ type: 'text', name: 'learning_style', nullable: true })
  learningStyle!: string | null;

  @Column({ type: 'text', name: 'course_preferences', nullable: true })
  coursePreferences!: string | null;

  @Column({ type: 'text', name: 'learning_notes', nullable: true })
  learningNotes!: string | null;

  @Column({ type: 'boolean', name: 'free_trial_used', default: false })
  freeTrialUsed!: boolean;

  @Column({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;
}
