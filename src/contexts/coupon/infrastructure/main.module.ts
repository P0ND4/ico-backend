import { Module } from '@nestjs/common';
import { CouponsModule } from './http-api/v1/coupons/coupons.module';

@Module({
  imports: [CouponsModule],
})
export class CouponModule {}
