import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GuestAuthRequest {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  deviceId?: string;
}
