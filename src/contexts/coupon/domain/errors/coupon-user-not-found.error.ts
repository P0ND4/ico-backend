import { DomainError } from 'src/contexts/shared/domain/errors/domain.error';

/** Defensive: the JWT subject no longer resolves to a user row. */
export class CouponUserNotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor() {
    super('coupon_user_not_found: User not found');
  }
}
