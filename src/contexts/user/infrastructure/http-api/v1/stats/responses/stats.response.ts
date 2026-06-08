import { ApiProperty } from '@nestjs/swagger';

export class StatsResponse {
  @ApiProperty({ example: 120 })
  totalStudyMinutes!: number;

  @ApiProperty({ example: 3 })
  pathsCompleted!: number;

  @ApiProperty({ example: 15 })
  chaptersCompleted!: number;

  @ApiProperty({ example: 60 })
  lessonsCompleted!: number;

  @ApiProperty({ example: 45 })
  correctAnswers!: number;

  @ApiProperty({ example: 60 })
  totalQuestionAnswers!: number;

  @ApiProperty({ example: 10 })
  pomodoroSessionsDone!: number;

  @ApiProperty({ example: 0.75, description: 'Ratio of correct answers (0-1)' })
  correctAnswerRate!: number;
}
