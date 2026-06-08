import { ApiProperty } from '@nestjs/swagger';

export class UserProfileResponse {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'John Doe', nullable: true })
  name!: string | null;

  @ApiProperty({ example: 'john@example.com', nullable: true })
  email!: string | null;

  @ApiProperty({ example: 'https://example.com/avatar.png', nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ example: 150 })
  xp!: number;

  @ApiProperty({ example: 2 })
  level!: number;

  @ApiProperty({ example: 7 })
  streakDays!: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', nullable: true })
  lastActiveAt!: Date | null;
}
