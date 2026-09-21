import { computeExpiredAccess } from './access-expiry.helper';
import type { UserEntity } from '../entities/auth/user.entity';

function makeUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return {
    id: 'user-1',
    email: 'test@example.com',
    planCode: 'free',
    isVip: false,
    vipExpiresAt: null,
    planExpiresAt: null,
    basePlanCode: null,
    ...overrides,
  } as UserEntity;
}

const NOW = new Date('2026-01-10T00:00:00.000Z');
const PAST = new Date('2026-01-09T00:00:00.000Z');
const FUTURE = new Date('2026-01-11T00:00:00.000Z');

describe('computeExpiredAccess', () => {
  it('returns null when nothing expired', () => {
    expect(computeExpiredAccess(makeUser(), NOW)).toBeNull();
  });

  it('returns null for a permanent VIP grant', () => {
    const user = makeUser({ isVip: true, vipExpiresAt: null });
    expect(computeExpiredAccess(user, NOW)).toBeNull();
  });

  it('returns null while the VIP grant is still running', () => {
    const user = makeUser({ isVip: true, vipExpiresAt: FUTURE });
    expect(computeExpiredAccess(user, NOW)).toBeNull();
  });

  it('drops VIP once the expiry elapsed', () => {
    const user = makeUser({ isVip: true, vipExpiresAt: PAST });
    expect(computeExpiredAccess(user, NOW)).toEqual({
      isVip: false,
      vipExpiresAt: null,
    });
  });

  it('treats an expiry exactly at now as elapsed', () => {
    const user = makeUser({ isVip: true, vipExpiresAt: NOW });
    expect(computeExpiredAccess(user, NOW)).toEqual({
      isVip: false,
      vipExpiresAt: null,
    });
  });

  it('restores the base plan when the plan upgrade expired', () => {
    const user = makeUser({
      planCode: 'pro',
      planExpiresAt: PAST,
      basePlanCode: 'free',
    });
    expect(computeExpiredAccess(user, NOW)).toEqual({
      planCode: 'free',
      planExpiresAt: null,
      basePlanCode: null,
    });
  });

  it('falls back to the default plan when no base plan was recorded', () => {
    const user = makeUser({
      planCode: 'pro',
      planExpiresAt: PAST,
      basePlanCode: null,
    });
    expect(computeExpiredAccess(user, NOW)?.planCode).toBe('free');
  });

  it('merges both expirations into a single patch', () => {
    const user = makeUser({
      isVip: true,
      vipExpiresAt: PAST,
      planCode: 'pro',
      planExpiresAt: PAST,
      basePlanCode: 'free',
    });
    expect(computeExpiredAccess(user, NOW)).toEqual({
      isVip: false,
      vipExpiresAt: null,
      planCode: 'free',
      planExpiresAt: null,
      basePlanCode: null,
    });
  });

  it('does not touch a non-VIP user carrying a stale expiry', () => {
    const user = makeUser({ isVip: false, vipExpiresAt: PAST });
    expect(computeExpiredAccess(user, NOW)).toBeNull();
  });
});
