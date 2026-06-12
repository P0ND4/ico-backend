import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPlanQuotaEntity } from '../../../domain/entities/auth/user-plan-quota.entity';
import type { IUserPlanQuotaRepository } from '../../../domain/repositories/auth/user-plan-quota.repository.interface';

@Injectable()
export class UserPlanQuotaTypeOrmRepository implements IUserPlanQuotaRepository {
  constructor(
    @InjectRepository(UserPlanQuotaEntity)
    private readonly repo: Repository<UserPlanQuotaEntity>,
  ) {}

  findByUserId(userId: string): Promise<UserPlanQuotaEntity | null> {
    return this.repo.findOne({ where: { userId } });
  }

  async ensureUserRecord(userId: string): Promise<UserPlanQuotaEntity> {
    const existing = await this.repo.findOne({ where: { userId } });
    if (existing) return existing;
    return this.repo.save(
      this.repo.create({
        userId,
        tutorUses: 0,
        summaryUses: 0,
        standardPathUses: 0,
        deepPathUses: 0,
        periodStartedAt: new Date(),
      }),
    );
  }

  async resetPeriod(userId: string): Promise<UserPlanQuotaEntity> {
    const now = new Date();
    const existing = await this.repo.findOne({ where: { userId } });
    if (!existing) {
      return this.repo.save(
        this.repo.create({
          userId,
          tutorUses: 0,
          summaryUses: 0,
          standardPathUses: 0,
          deepPathUses: 0,
          periodStartedAt: now,
        }),
      );
    }
    existing.tutorUses = 0;
    existing.summaryUses = 0;
    existing.standardPathUses = 0;
    existing.deepPathUses = 0;
    existing.periodStartedAt = now;
    return this.repo.save(existing);
  }

  async incrementTutorUse(userId: string): Promise<UserPlanQuotaEntity> {
    const record = await this.ensureUserRecord(userId);
    record.tutorUses += 1;
    return this.repo.save(record);
  }

  async incrementSummaryUse(userId: string): Promise<UserPlanQuotaEntity> {
    const record = await this.ensureUserRecord(userId);
    record.summaryUses += 1;
    return this.repo.save(record);
  }

  async incrementStandardPathUse(userId: string): Promise<UserPlanQuotaEntity> {
    const record = await this.ensureUserRecord(userId);
    record.standardPathUses += 1;
    return this.repo.save(record);
  }

  async incrementDeepPathUse(userId: string): Promise<UserPlanQuotaEntity> {
    const record = await this.ensureUserRecord(userId);
    record.deepPathUses += 1;
    return this.repo.save(record);
  }
}
