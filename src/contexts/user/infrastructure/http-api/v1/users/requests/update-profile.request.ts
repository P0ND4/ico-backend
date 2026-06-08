import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileRequest {
  @ApiPropertyOptional({
    description: 'Display name for the user',
    example: 'John Doe',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string | null;

  @ApiPropertyOptional({
    description: 'URL of the user avatar image',
    example: 'https://example.com/avatar.png',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string | null;
}
