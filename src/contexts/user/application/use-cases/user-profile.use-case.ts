import { Inject, Injectable } from '@nestjs/common';
import { UNIT_OF_WORK } from 'src/contexts/shared/domain/repositories/unit-of-work.interface';
import type { IUnitOfWork } from 'src/contexts/shared/domain/repositories/unit-of-work.interface';
import type { UserEntity } from 'src/contexts/shared/domain/entities/auth/user.entity';
import type { IUserProfileUseCase } from '../../domain/contracts/i-user-profile.use-case';
import { UserProfileDto } from '../dtos/user-profile.dto';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { StatsDto } from '../dtos/stats.dto';
import { UserNotFoundError } from '../../domain/errors/auth/index';
import { resolveTrialQuotaForProfile } from 'src/contexts/shared/domain/utils/trial-usage.helper';
import { resolveEffectiveAccess } from 'src/contexts/shared/domain/utils/access-expiry.helper';
import { isVipActive } from 'src/contexts/shared/domain/utils/plan-guard';

@Injectable()
export class UserProfileUseCase implements IUserProfileUseCase {
  constructor(
    @Inject(UNIT_OF_WORK)
    private readonly uow: IUnitOfWork,
  ) {}

  async getMe(userId: string): Promise<UserProfileDto> {
    const user = await this.uow.users.findById(userId);
    if (!user) throw new UserNotFoundError();
    const allLevels = await this.uow.xpLevels.findAll();
    const sorted = allLevels.sort((a, b) => a.minXp - b.minXp);
    const currentLvl = sorted.filter((l) => l.minXp <= user.xp).at(-1);
    const nextLvl = sorted.find((l) => l.minXp > user.xp);
    return this.toDto(
      user,
      currentLvl?.minXp ?? 0,
      nextLvl?.minXp ?? (currentLvl?.maxXp ?? 500) + 1,
    );
  }

  async updateMe(
    userId: string,
    data: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    const user = await this.uow.users.update(userId, {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      ...(data.themeMode !== undefined && { themeMode: data.themeMode }),
      ...(data.learningStyle !== undefined && {
        learningStyle: data.learningStyle,
      }),
      ...(data.coursePreferences !== undefined && {
        coursePreferences: data.coursePreferences,
      }),
      ...(data.learningNotes !== undefined && {
        learningNotes: data.learningNotes,
      }),
    });
    if (!user) throw new UserNotFoundError();
    return this.getMe(userId);
  }

  async deleteMe(userId: string): Promise<void> {
    const user = await this.uow.users.findById(userId);
    if (!user) throw new UserNotFoundError();

    const deviceId = user.deviceId ?? user.guestDeviceId;
    const isGuest = user.email === null;

    if (deviceId) {
      await this.uow.deviceTrials.markUsed(deviceId, userId);
    }

    if (isGuest) {
      await this.uow.users.hardDelete(userId);
    } else {
      await this.uow.users.update(userId, { deletedAt: new Date() });
    }
  }

  async getStats(userId: string): Promise<StatsDto> {
    const stats = await this.uow.userStats.findByUserId(userId);

    if (!stats) {
      return {
        totalStudyMinutes: 0,
        pathsCompleted: 0,
        chaptersCompleted: 0,
        lessonsCompleted: 0,
        correctAnswers: 0,
        totalQuestionAnswers: 0,
        pomodoroSessionsDone: 0,
        correctAnswerRate: 0,
      };
    }

    const correctAnswerRate =
      stats.totalQuestionAnswers > 0
        ? stats.correctAnswers / stats.totalQuestionAnswers
        : 0;

    return {
      totalStudyMinutes: stats.totalStudyMinutes,
      pathsCompleted: stats.pathsCompleted,
      chaptersCompleted: stats.chaptersCompleted,
      lessonsCompleted: stats.lessonsCompleted,
      correctAnswers: stats.correctAnswers,
      totalQuestionAnswers: stats.totalQuestionAnswers,
      pomodoroSessionsDone: stats.pomodoroSessionsDone,
      correctAnswerRate,
    };
  }

  private async toDto(
    user: UserEntity,
    currentLevelMinXp: number,
    nextLevelMinXp: number,
  ): Promise<UserProfileDto> {
    // Lazily normalizes expired VIP / plan grants before reporting access.
    const { user: effectiveUser, plan } = await resolveEffectiveAccess(
      this.uow,
      user,
    );
    const trialQuota = await resolveTrialQuotaForProfile(
      this.uow,
      effectiveUser,
      plan,
    );

    const vipActive = isVipActive(effectiveUser);

    return {
      id: effectiveUser.id,
      name: effectiveUser.name,
      email: effectiveUser.email,
      avatarUrl: effectiveUser.avatarUrl,
      xp: effectiveUser.xp,
      level: effectiveUser.level,
      streakDays: effectiveUser.streakDays,
      lastActiveAt: effectiveUser.lastActiveAt,
      currentLevelMinXp,
      nextLevelMinXp,
      planCode: effectiveUser.planCode,
      planLabel: plan?.label ?? effectiveUser.planCode,
      isDefaultFreePlan: plan?.isDefaultFree === true,
      isUnlimitedPlan: vipActive || plan?.isUnlimited === true,
      adsEnabled: plan?.adsEnabled ?? true,
      isVip: vipActive,
      freeTrialUsed: effectiveUser.freeTrialUsed,
      trialTutorRemaining: trialQuota.trialTutorRemaining,
      trialSummaryRemaining: trialQuota.trialSummaryRemaining,
      trialStandardPathRemaining: trialQuota.trialStandardPathRemaining,
      trialDeepPathRemaining: trialQuota.trialDeepPathRemaining,
      tutorRequestLimit: trialQuota.tutorRequestLimit,
      summaryRequestLimit: trialQuota.summaryRequestLimit,
      standardPathLimit: trialQuota.standardPathLimit,
      deepPathLimit: trialQuota.deepPathLimit,
      quotaRenewsAt: trialQuota.quotaRenewsAt,
      trialExhausted: trialQuota.trialExhausted,
      vipExpiresAt: vipActive ? effectiveUser.vipExpiresAt : null,
      planExpiresAt: effectiveUser.planExpiresAt,
      bonusTutorRemaining: trialQuota.bonusTutorRemaining,
      bonusSummaryRemaining: trialQuota.bonusSummaryRemaining,
      bonusStandardPathRemaining: trialQuota.bonusStandardPathRemaining,
      bonusDeepPathRemaining: trialQuota.bonusDeepPathRemaining,
      hasQuotaBonus: trialQuota.hasQuotaBonus,
      themeMode: effectiveUser.themeMode,
      learningStyle: effectiveUser.learningStyle,
      coursePreferences: effectiveUser.coursePreferences,
      learningNotes: effectiveUser.learningNotes,
    };
  }
}
