export const AI_PATH_GENERATOR = 'AI_PATH_GENERATOR';

export interface GeneratedLesson {
  title: string | null;
  type: 'theory' | 'concept' | 'example' | 'multiple_choice' | 'true_false';
  content: string;
  question: string | null;
  options: string[] | null;
  correctIndex: number | null;
  correctAnswer: boolean | null;
  points: number;
  order: number;
}

export interface GeneratedChapter {
  title: string;
  order: number;
  lessons: GeneratedLesson[];
}

export interface GeneratedPath {
  title: string;
  description: string;
  tagNames: string[];
  chapters: GeneratedChapter[];
}

export interface IAiPathGenerator {
  generate(topic: string, mode: 'standard' | 'deep'): Promise<GeneratedPath>;
}
