import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';

export class AnswerLessonRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  selectedIndex?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  selectedAnswer?: boolean;

  @ApiProperty()
  @IsBoolean()
  isCorrect!: boolean;
}
