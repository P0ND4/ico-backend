export interface UserProfileType {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  xp: number;
  level: number;
  streakDays: number;
  lastActiveAt: Date | null;
}

export interface UpdateProfileType {
  name?: string | null;
  avatarUrl?: string | null;
}

export interface StatsType {
  totalStudyMinutes: number;
  pathsCompleted: number;
  chaptersCompleted: number;
  lessonsCompleted: number;
  correctAnswers: number;
  totalQuestionAnswers: number;
  pomodoroSessionsDone: number;
  correctAnswerRate: number;
}
