import { DomainError } from 'src/contexts/shared/domain/errors/domain.error';

/** 410 Gone separates "expired" from "exhausted" without parsing the message. */
export class CouponExpiredError extends DomainError {
  readonly statusCode = 410;

  constructor() {
    super('coupon_expired: Coupon expired');
  }
}
