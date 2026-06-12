import type { UpdateProfileType } from '../../domain/types/user-profile.types';

export class UpdateProfileDto implements UpdateProfileType {
  name?: string | null;
  avatarUrl?: string | null;
  themeMode?: string;
  learningStyle?: string | null;
  coursePreferences?: string | null;
  learningNotes?: string | null;
}
