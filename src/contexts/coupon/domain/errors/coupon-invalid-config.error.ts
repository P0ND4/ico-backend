import { DomainError } from 'src/contexts/shared/domain/errors/domain.error';

/** Operator data error, not a user error. */
export class CouponInvalidConfigError extends DomainError {
  readonly statusCode = 500;

  constructor(code: string) {
    super(`coupon_invalid_config: Coupon ${code} is misconfigured`);
  }
}
