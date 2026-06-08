import type {
  UserProfileType,
  UpdateProfileType,
  StatsType,
} from '../types/user-profile.types';

export const USER_PROFILE_USE_CASE = Symbol('USER_PROFILE_USE_CASE');

export interface IUserProfileUseCase {
  getMe(userId: string): Promise<UserProfileType>;
  updateMe(userId: string, data: UpdateProfileType): Promise<UserProfileType>;
  deleteMe(userId: string): Promise<void>;
  getStats(userId: string): Promise<StatsType>;
}
