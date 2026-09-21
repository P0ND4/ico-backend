import { DomainError } from 'src/contexts/shared/domain/errors/domain.error';

export class CouponExhaustedError extends DomainError {
  readonly statusCode = 409;

  constructor() {
    super('coupon_exhausted: Coupon reached its redemption limit');
  }
}
