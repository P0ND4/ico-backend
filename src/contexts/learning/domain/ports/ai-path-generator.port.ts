export const AI_PATH_GENERATOR = 'AI_PATH_GENERATOR';

export interface GeneratedLesson {
  title: string | null;
  type: 'theory' | 'concept' | 'example' | 'multiple_choice' | 'true_false' | 'open_ended';
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
  isExam?: boolean;
  lessons: GeneratedLesson[];
}

export interface GeneratedPath {
  title: string;
  description: string;
  tagNames: string[];
  chapters: GeneratedChapter[];
}

export interface GenerateOptions {
  onProgress?: (progress: number, label: string) => Promise<void>;
}

export interface IAiPathGenerator {
  generate(topic: string, mode: 'standard' | 'deep', options?: GenerateOptions): Promise<GeneratedPath>;
  ask(context: string, question: string): Promise<string>;
}
