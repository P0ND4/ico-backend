import type { UpdateProfileType } from '../../domain/types/user-profile.types';

export class UpdateProfileDto implements UpdateProfileType {
  name?: string | null;
  avatarUrl?: string | null;
}
