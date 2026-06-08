import type { UserProfileType } from '../../domain/types/user-profile.types';

export class UserProfileDto implements UserProfileType {
  id!: string;
  name!: string | null;
  email!: string | null;
  avatarUrl!: string | null;
  xp!: number;
  level!: number;
  streakDays!: number;
  lastActiveAt!: Date | null;
}
