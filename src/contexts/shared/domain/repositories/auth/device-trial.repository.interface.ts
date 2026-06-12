import type { DeviceTrialEntity } from '../../entities/auth/device-trial.entity';

export interface IDeviceTrialRepository {
  findByDeviceId(deviceId: string): Promise<DeviceTrialEntity | null>;
  ensureDeviceRecord(deviceId: string, userId: string): Promise<DeviceTrialEntity>;
  markUsed(deviceId: string, userId: string): Promise<void>;
  resetPeriod(deviceId: string, userId: string): Promise<DeviceTrialEntity>;
  incrementTutorUse(deviceId: string, userId: string): Promise<DeviceTrialEntity>;
  incrementSummaryUse(deviceId: string, userId: string): Promise<DeviceTrialEntity>;
  incrementStandardPathUse(deviceId: string, userId: string): Promise<DeviceTrialEntity>;
  incrementDeepPathUse(deviceId: string, userId: string): Promise<DeviceTrialEntity>;
}
