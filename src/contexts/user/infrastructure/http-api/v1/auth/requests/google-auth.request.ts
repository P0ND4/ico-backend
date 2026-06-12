import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GoogleAuthRequest {
  @ApiProperty({
    description: 'Google ID token obtained from the Google Sign-In SDK',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOWdkazcifQ...',
  })
  @IsString()
  idToken!: string;

  @ApiPropertyOptional({ description: 'Stable device identifier for trial abuse prevention' })
  @IsOptional()
  @IsString()
  deviceId?: string;
}
