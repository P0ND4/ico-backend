import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TutorConversationEntity } from './tutor-conversation.entity';

@Entity({ schema: 'trn', name: 'tutor_messages' })
export class TutorMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'conversation_id' })
  conversationId!: string;

  @ManyToOne(() => TutorConversationEntity)
  @JoinColumn({ name: 'conversation_id' })
  conversation!: TutorConversationEntity;

  @Column({ type: 'varchar', length: 50 })
  role!: string;

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
