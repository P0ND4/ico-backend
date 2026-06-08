import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshRequest {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  refreshToken!: string;
}
