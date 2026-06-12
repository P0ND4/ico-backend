import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AppleAuthRequest {
  @ApiProperty({
    description: 'Apple identity token obtained from Sign in with Apple SDK',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjhlTjY...',
  })
  @IsString()
  identityToken!: string;

  @ApiPropertyOptional({
    description:
      'Full name provided by Apple — only available on the first sign-in',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ description: 'Stable device identifier for trial abuse prevention' })
  @IsOptional()
  @IsString()
  deviceId?: string;
}
