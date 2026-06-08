export interface LessonType {
  id: string;
  chapterId: string;
  type: string;
  title: string | null;
  content: string;
  question: string | null;
  options: string[] | null;
  correctIndex: number | null;
  correctAnswer: boolean | null;
  points: number;
  order: number;
  createdAt: Date;
}

export interface ChapterSummaryType {
  id: string;
  title: string;
  order: number;
  status: string;
  maxXp: number;
  earnedXp: number;
  completedAt: Date | null;
}

export interface PathListItemType {
  id: string;
  title: string;
  description: string | null;
  mode: string;
  status: string;
  totalXp: number;
  earnedXp: number;
  chapterCount: number;
  completedChapterCount: number;
  createdAt: Date;
}

export interface PathDetailType extends PathListItemType {
  topic: string;
  chapters: ChapterSummaryType[];
}

export interface ChapterDetailType {
  id: string;
  pathId: string;
  title: string;
  order: number;
  status: string;
  maxXp: number;
  earnedXp: number;
  correctAnswers: number;
  totalQuestions: number;
  completedAt: Date | null;
  createdAt: Date;
  lessons: LessonType[];
}

export interface JobStatusType {
  id: string;
  status: string;
  pathId: string;
  errorMsg: string | null;
  createdAt: Date;
}

export interface GeneratePathResultType {
  jobId: string;
  pathId: string;
  status: string;
}
