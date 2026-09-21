import { Module } from '@nestjs/common';
import { SharedModule } from 'src/contexts/shared/shared.module';
import { COUPON_USE_CASE } from 'src/contexts/coupon/domain/contracts/i-coupon.use-case';
import { CouponUseCase } from 'src/contexts/coupon/application/use-cases/coupon.use-case';
import { CouponsController } from './controllers/coupons.controller';

@Module({
  imports: [SharedModule],
  providers: [{ provide: COUPON_USE_CASE, useClass: CouponUseCase }],
  controllers: [CouponsController],
})
export class CouponsModule {}
