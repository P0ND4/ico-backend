import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../auth/user.entity';

@Entity({ schema: 'trn', name: 'summaries' })
export class SummaryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'text', name: 'original_text' })
  originalText!: string;

  @Column({ type: 'text', name: 'summary_text' })
  summaryText!: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'source_filename',
    nullable: true,
  })
  sourceFilename!: string | null;

  @Column({ type: 'varchar', length: 50, name: 'source_type', nullable: true })
  sourceType!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
