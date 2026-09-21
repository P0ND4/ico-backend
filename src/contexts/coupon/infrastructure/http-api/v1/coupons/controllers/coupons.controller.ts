import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { minutes, Throttle } from '@nestjs/throttler';
import type { JwtPayload } from 'src/contexts/shared/guards/jwt-auth.guard';
import { COUPON_USE_CASE } from 'src/contexts/coupon/domain/contracts/i-coupon.use-case';
import type { ICouponUseCase } from 'src/contexts/coupon/domain/contracts/i-coupon.use-case';
import { RedeemCouponRequest } from '../requests/redeem-coupon.request';

@ApiBearerAuth('access-token')
@ApiTags('Coupons')
@Controller('v1/coupons')
export class CouponsController {
  constructor(
    @Inject(COUPON_USE_CASE)
    private readonly couponUseCase: ICouponUseCase,
  ) {}

  @Post('redeem')
  @HttpCode(HttpStatus.OK)
  // The global throttler (700/30min) is far too permissive against code brute force.
  @Throttle({ default: { limit: 10, ttl: minutes(10) } })
  @ApiOperation({
    summary: 'Redeem a coupon',
    description:
      'Redeems a coupon for the authenticated user. Codes are normalized to uppercase.',
  })
  @ApiResponse({ status: 200, description: 'Coupon redeemed.' })
  @ApiResponse({ status: 403, description: 'A linked account is required.' })
  @ApiResponse({ status: 404, description: 'Coupon not found.' })
  @ApiResponse({
    status: 409,
    description: 'Coupon exhausted or already redeemed.',
  })
  @ApiResponse({ status: 410, description: 'Coupon expired.' })
  redeem(
    @Request() req: { user: JwtPayload },
    @Body() body: RedeemCouponRequest,
  ) {
    return this.couponUseCase.redeem({ userId: req.user.sub, code: body.code });
  }

  @Get('mine')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List my coupon redemptions',
    description: 'Returns the redemption history of the authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'Redemption history returned.' })
  listMine(@Request() req: { user: JwtPayload }) {
    return this.couponUseCase.listMine(req.user.sub);
  }
}
