import type { StatsType } from '../../domain/types/user-profile.types';

export class StatsDto implements StatsType {
  totalStudyMinutes!: number;
  pathsCompleted!: number;
  chaptersCompleted!: number;
  lessonsCompleted!: number;
  correctAnswers!: number;
  totalQuestionAnswers!: number;
  pomodoroSessionsDone!: number;
  correctAnswerRate!: number;
}
