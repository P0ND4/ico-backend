import { Inject, Injectable } from '@nestjs/common';
import { UNIT_OF_WORK } from 'src/contexts/shared/domain/repositories/unit-of-work.interface';
import type { IUnitOfWork } from 'src/contexts/shared/domain/repositories/unit-of-work.interface';
import type { UserEntity } from 'src/contexts/shared/domain/entities/auth/user.entity';
import type { IUserProfileUseCase } from '../../domain/contracts/i-user-profile.use-case';
import { UserProfileDto } from '../dtos/user-profile.dto';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { StatsDto } from '../dtos/stats.dto';
import { UserNotFoundError } from '../../domain/errors/auth/index';

@Injectable()
export class UserProfileUseCase implements IUserProfileUseCase {
  constructor(
    @Inject(UNIT_OF_WORK)
    private readonly uow: IUnitOfWork,
  ) {}

  async getMe(userId: string): Promise<UserProfileDto> {
    const user = await this.uow.users.findById(userId);
    if (!user) throw new UserNotFoundError();
    return this.toDto(user);
  }

  async updateMe(
    userId: string,
    data: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    const user = await this.uow.users.update(userId, {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
    });
    if (!user) throw new UserNotFoundError();
    return this.toDto(user);
  }

  async deleteMe(userId: string): Promise<void> {
    await this.uow.users.hardDelete(userId);
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

  private toDto(user: UserEntity): UserProfileDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      xp: user.xp,
      level: user.level,
      streakDays: user.streakDays,
      lastActiveAt: user.lastActiveAt,
    };
  }
}
