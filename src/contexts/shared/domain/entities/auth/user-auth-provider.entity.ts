import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { AuthProviderEntity } from '../catalog/auth-provider.entity';

@Entity({ schema: 'trn', name: 'user_auth_providers' })
@Unique(['providerId', 'providerUserId'])
export class UserAuthProviderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'uuid', name: 'provider_id' })
  providerId!: string;

  @ManyToOne(() => AuthProviderEntity, { eager: false })
  @JoinColumn({ name: 'provider_id' })
  provider!: AuthProviderEntity;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'provider_user_id',
    nullable: true,
  })
  providerUserId!: string | null;

  @Column({ type: 'text', name: 'access_token', nullable: true })
  accessToken!: string | null;

  @Column({ type: 'text', name: 'refresh_token', nullable: true })
  refreshToken!: string | null;

  @Column({ type: 'timestamptz', name: 'token_expires_at', nullable: true })
  tokenExpiresAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
