import type { DataSource } from 'typeorm';
import { SubscriptionPlanEntity } from 'src/contexts/shared/domain/entities/config/subscription-plan.entity';

/**
 * Manual plan management (no admin UI):
 * 1. INSERT/upsert row in con.subscription_plans
 * 2. App reloads catalog via GET /catalog/subscription-plans
 * 3. Support activates user: UPDATE auth.users SET plan_code = '...' WHERE id = ...
 *
 * Quota renewal: quota_reset_days (NULL=lifetime), quota_scope (device|user),
 * enforce_device_trial_slot (free anti-abuse for second account on same device).
 */
export async function seedSubscriptionPlans(ds: DataSource): Promise<void> {
  await ds.getRepository(SubscriptionPlanEntity).upsert(
    [
      {
        code: 'free',
        label: 'Gratuito',
        priceMonthly: null,
        priceAnnual: null,
        maxStandardPaths: 2,
        maxDeepPaths: 1,
        maxChapters: 2,
        maxLessons: 3,
        maxTutorRequests: 5,
        maxSummaryRequests: 2,
        adsEnabled: true,
        isDefaultFree: true,
        isUnlimited: false,
        showInPaywall: false,
        sortOrder: 0,
        quotaResetDays: null,
        quotaScope: 'device',
        enforceDeviceTrialSlot: true,
      },
      {
        code: 'pro',
        label: 'Pro',
        priceMonthly: 5.0,
        priceAnnual: 50.0,
        maxStandardPaths: 10,
        maxDeepPaths: 5,
        maxChapters: null,
        maxLessons: null,
        maxTutorRequests: 50,
        maxSummaryRequests: 20,
        adsEnabled: false,
        isDefaultFree: false,
        isUnlimited: false,
        showInPaywall: true,
        sortOrder: 1,
        quotaResetDays: 15,
        quotaScope: 'user',
        enforceDeviceTrialSlot: false,
      },
      {
        code: 'pro-plus',
        label: 'Pro Plus',
        priceMonthly: 10.0,
        priceAnnual: 100.0,
        maxStandardPaths: 20,
        maxDeepPaths: 10,
        maxChapters: null,
        maxLessons: null,
        maxTutorRequests: 100,
        maxSummaryRequests: 40,
        adsEnabled: false,
        isDefaultFree: false,
        isUnlimited: false,
        showInPaywall: true,
        sortOrder: 2,
        quotaResetDays: 7,
        quotaScope: 'user',
        enforceDeviceTrialSlot: false,
      },
      {
        code: 'premium',
        label: 'Premium',
        priceMonthly: 20.0,
        priceAnnual: 200.0,
        maxStandardPaths: null,
        maxDeepPaths: null,
        maxChapters: null,
        maxLessons: null,
        maxTutorRequests: null,
        maxSummaryRequests: null,
        adsEnabled: false,
        isDefaultFree: false,
        isUnlimited: true,
        showInPaywall: true,
        sortOrder: 3,
        quotaResetDays: null,
        quotaScope: 'user',
        enforceDeviceTrialSlot: false,
      },
    ],
    { conflictPaths: ['code'], skipUpdateIfNoValuesChanged: true },
  );
}
