import { DomainError } from 'src/contexts/shared/domain/errors/domain.error';

/**
 * Guests (`email === null`) cannot redeem: otherwise wiping the guest data and
 * signing up again would reset the per-user redemption guard.
 */
export class CouponRequiresLinkedAccountError extends DomainError {
  readonly statusCode = 403;

  constructor() {
    super(
      'coupon_requires_linked_account: A linked account is required to redeem coupons',
    );
  }
}
