import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

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

  @ApiPropertyOptional({
    description: 'Preferred theme mode',
    enum: ['system', 'light', 'dark'],
    example: 'dark',
  })
  @IsOptional()
  @IsEnum(['system', 'light', 'dark'])
  themeMode?: string;

  @ApiPropertyOptional({ description: 'How the user learns best', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  learningStyle?: string | null;

  @ApiPropertyOptional({ description: 'What the user likes in a course', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coursePreferences?: string | null;

  @ApiPropertyOptional({ description: 'Additional learning context', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  learningNotes?: string | null;
}
