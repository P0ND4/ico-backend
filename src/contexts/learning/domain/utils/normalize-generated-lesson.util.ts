import type {
  GeneratedLesson,
  GeneratedPath,
} from '../ports/ai-path-generator.port';

const READING_TYPES = new Set(['theory', 'concept', 'example']);

function resolveMultipleChoiceIndex(
  options: string[],
  correctIndex: number | null | undefined,
  correctAnswer: unknown,
): number | null {
  if (typeof correctIndex === 'number' && Number.isInteger(correctIndex)) {
    if (correctIndex >= 0 && correctIndex < options.length) return correctIndex;
  }

  if (typeof correctIndex === 'string') {
    const parsed = Number(correctIndex);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed < options.length) {
      return parsed;
    }
  }

  if (
    typeof correctAnswer === 'number' &&
    Number.isInteger(correctAnswer) &&
    correctAnswer >= 0 &&
    correctAnswer < options.length
  ) {
    return correctAnswer;
  }

  if (typeof correctAnswer === 'string') {
    const normalized = correctAnswer.trim().toLowerCase();
    const exact = options.findIndex(
      (option) => option.trim().toLowerCase() === normalized,
    );
    if (exact >= 0) return exact;

    const partial = options.findIndex((option) => {
      const optionNormalized = option.trim().toLowerCase();
      return (
        optionNormalized.includes(normalized) ||
        normalized.includes(optionNormalized)
      );
    });
    if (partial >= 0) return partial;
  }

  return options.length > 0 ? 0 : null;
}

function resolveTrueFalseAnswer(correctAnswer: unknown): boolean | null {
  if (typeof correctAnswer === 'boolean') return correctAnswer;

  if (typeof correctAnswer === 'string') {
    const normalized = correctAnswer.trim().toLowerCase();
    if (['true', 'verdadero', 'sí', 'si', 'yes', '1'].includes(normalized)) {
      return true;
    }
    if (['false', 'falso', 'no', '0'].includes(normalized)) {
      return false;
    }
  }

  return null;
}

function resolveLessonType(lesson: GeneratedLesson): GeneratedLesson['type'] {
  const rawType = String(lesson.type).toLowerCase();

  if (
    rawType === 'interactive' ||
    rawType === 'quiz' ||
    rawType === 'question'
  ) {
    return lesson.options?.length ? 'multiple_choice' : 'true_false';
  }

  if (
    rawType === 'theory' ||
    rawType === 'concept' ||
    rawType === 'example' ||
    rawType === 'multiple_choice' ||
    rawType === 'true_false' ||
    rawType === 'open_ended'
  ) {
    return rawType;
  }

  return 'theory';
}

export function normalizeGeneratedLesson(
  lesson: GeneratedLesson,
): GeneratedLesson {
  const type = resolveLessonType(lesson);

  if (READING_TYPES.has(type)) {
    return {
      ...lesson,
      type,
      question: null,
      options: null,
      correctIndex: null,
      correctAnswer: null,
    };
  }

  if (type === 'open_ended') {
    return {
      ...lesson,
      type,
      options: null,
      correctIndex: null,
      correctAnswer: null,
    };
  }

  if (type === 'multiple_choice') {
    const options = (lesson.options ?? []).filter(
      (option): option is string =>
        typeof option === 'string' && option.trim().length > 0,
    );

    return {
      ...lesson,
      type,
      options: options.length ? options : null,
      correctIndex: options.length
        ? resolveMultipleChoiceIndex(
            options,
            lesson.correctIndex,
            lesson.correctAnswer,
          )
        : null,
      correctAnswer: null,
    };
  }

  return {
    ...lesson,
    type: 'true_false',
    options: null,
    correctIndex: null,
    correctAnswer: resolveTrueFalseAnswer(lesson.correctAnswer),
  };
}

export function normalizeGeneratedPath(path: GeneratedPath): GeneratedPath {
  return {
    ...path,
    chapters: path.chapters.map((chapter) => ({
      ...chapter,
      lessons: (chapter.lessons ?? []).map(normalizeGeneratedLesson),
    })),
  };
}
