import type { DataSource } from 'typeorm';
import { CouponEntity } from 'src/contexts/shared/domain/entities/config/coupon.entity';

/**
 * Manual coupon management (no admin UI):
 * 1. INSERT/upsert a row in con.coupons with the code in UPPERCASE
 * 2. Users redeem it via POST /api/v1/coupons/redeem
 * 3. Kill a coupon with: UPDATE con.coupons SET is_active = false WHERE code = '...'
 *
 * `redeemedCount` is deliberately never part of the seed payload: the upsert
 * would reset the live counter on every boot.
 *
 * `label`-style user-facing wording lives in `effect_summary`, generated at
 * redemption time; seeds only carry configuration.
 */
export async function seedCoupons(ds: DataSource): Promise<void> {
  await ds.getRepository(CouponEntity).upsert(
    [
      {
        code: 'BIENVENIDA20',
        grantType: 'quota_bonus',
        resource: 'tutor',
        amount: 20,
        planCode: null,
        durationDays: null,
        maxRedemptions: 1000,
        expiresAt: null,
        isActive: true,
      },
      {
        code: 'RESUMEN10',
        grantType: 'quota_bonus',
        resource: 'summary',
        amount: 10,
        planCode: null,
        durationDays: null,
        maxRedemptions: 500,
        expiresAt: null,
        isActive: true,
      },
      {
        code: 'VIP30',
        grantType: 'vip_access',
        resource: null,
        amount: null,
        planCode: null,
        durationDays: 30,
        maxRedemptions: 100,
        expiresAt: null,
        isActive: true,
      },
      {
        code: 'PRO90',
        grantType: 'plan_upgrade',
        resource: null,
        amount: null,
        planCode: 'pro',
        durationDays: 90,
        maxRedemptions: 200,
        expiresAt: null,
        isActive: true,
      },
    ],
    { conflictPaths: ['code'], skipUpdateIfNoValuesChanged: true },
  );
}
