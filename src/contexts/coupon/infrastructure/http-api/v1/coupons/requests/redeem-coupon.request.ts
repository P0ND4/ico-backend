import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RedeemCouponRequest {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(40)
  @Matches(/^[A-Za-z0-9._-]+$/, {
    message:
      'code must contain only letters, digits, dots, dashes or underscores',
  })
  code!: string;
}
