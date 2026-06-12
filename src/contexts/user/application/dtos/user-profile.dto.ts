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
  currentLevelMinXp!: number;
  nextLevelMinXp!: number;
  planCode!: string;
  planLabel!: string;
  isDefaultFreePlan!: boolean;
  isUnlimitedPlan!: boolean;
  adsEnabled!: boolean;
  isVip!: boolean;
  freeTrialUsed!: boolean;
  trialTutorRemaining!: number | null;
  trialSummaryRemaining!: number | null;
  trialStandardPathRemaining!: number | null;
  trialDeepPathRemaining!: number | null;
  tutorRequestLimit!: number | null;
  summaryRequestLimit!: number | null;
  standardPathLimit!: number | null;
  deepPathLimit!: number | null;
  quotaRenewsAt!: Date | null;
  trialExhausted!: boolean;
  themeMode!: string;
}
