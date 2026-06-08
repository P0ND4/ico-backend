import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CompleteChapterRequest {
  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  earnedXp!: number;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  correctCount!: number;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  totalQuestions!: number;
}
