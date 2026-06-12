import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceTrialEntity } from '../../../domain/entities/auth/device-trial.entity';
import type { IDeviceTrialRepository } from '../../../domain/repositories/auth/device-trial.repository.interface';

@Injectable()
export class DeviceTrialTypeOrmRepository implements IDeviceTrialRepository {
  constructor(
    @InjectRepository(DeviceTrialEntity)
    private readonly repo: Repository<DeviceTrialEntity>,
  ) {}

  findByDeviceId(deviceId: string): Promise<DeviceTrialEntity | null> {
    return this.repo.findOne({ where: { deviceId } });
  }

  async ensureDeviceRecord(deviceId: string, userId: string): Promise<DeviceTrialEntity> {
    const existing = await this.repo.findOne({ where: { deviceId } });
    if (existing) return existing;
    return this.repo.save(
      this.repo.create({
        deviceId,
        userId,
        usedAt: new Date(),
        tutorUses: 0,
        summaryUses: 0,
        standardPathUses: 0,
        deepPathUses: 0,
        periodStartedAt: new Date(),
      }),
    );
  }

  async markUsed(deviceId: string, userId: string): Promise<void> {
    await this.ensureDeviceRecord(deviceId, userId);
  }

  async resetPeriod(deviceId: string, userId: string): Promise<DeviceTrialEntity> {
    const now = new Date();
    const existing = await this.repo.findOne({ where: { deviceId } });
    if (!existing) {
      return this.repo.save(
        this.repo.create({
          deviceId,
          userId,
          usedAt: now,
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
    existing.userId = userId;
    return this.repo.save(existing);
  }

  async incrementTutorUse(deviceId: string, userId: string): Promise<DeviceTrialEntity> {
    const existing = await this.ensureDeviceRecord(deviceId, userId);
    existing.tutorUses += 1;
    return this.repo.save(existing);
  }

  async incrementSummaryUse(deviceId: string, userId: string): Promise<DeviceTrialEntity> {
    const existing = await this.ensureDeviceRecord(deviceId, userId);
    existing.summaryUses += 1;
    return this.repo.save(existing);
  }

  async incrementStandardPathUse(deviceId: string, userId: string): Promise<DeviceTrialEntity> {
    const existing = await this.ensureDeviceRecord(deviceId, userId);
    existing.standardPathUses += 1;
    return this.repo.save(existing);
  }

  async incrementDeepPathUse(deviceId: string, userId: string): Promise<DeviceTrialEntity> {
    const existing = await this.ensureDeviceRecord(deviceId, userId);
    existing.deepPathUses += 1;
    return this.repo.save(existing);
  }
}
