import {
  normalizeGeneratedLesson,
  normalizeGeneratedPath,
} from './normalize-generated-lesson.util';
import type { GeneratedLesson } from '../ports/ai-path-generator.port';

function lesson(overrides: Partial<GeneratedLesson>): GeneratedLesson {
  return {
    title: 'Test',
    type: 'multiple_choice',
    content: 'Content',
    question: 'Question?',
    options: ['A', 'B', 'C', 'D'],
    correctIndex: null,
    correctAnswer: null,
    points: 20,
    order: 1,
    ...overrides,
  };
}

describe('normalizeGeneratedLesson', () => {
  it('maps interactive + string correctAnswer to multiple_choice index', () => {
    const normalized = normalizeGeneratedLesson(
      lesson({
        type: 'interactive' as GeneratedLesson['type'],
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
        correctAnswer: 'O(n)' as unknown as boolean,
      }),
    );

    expect(normalized.type).toBe('multiple_choice');
    expect(normalized.correctIndex).toBe(2);
    expect(normalized.correctAnswer).toBeNull();
  });

  it('keeps valid multiple_choice index', () => {
    const normalized = normalizeGeneratedLesson(
      lesson({ correctIndex: 1, correctAnswer: null }),
    );

    expect(normalized.correctIndex).toBe(1);
    expect(normalized.correctAnswer).toBeNull();
  });

  it('maps true_false string answers to boolean', () => {
    const normalized = normalizeGeneratedLesson(
      lesson({
        type: 'true_false',
        options: null,
        correctAnswer: 'verdadero' as unknown as boolean,
      }),
    );

    expect(normalized.type).toBe('true_false');
    expect(normalized.correctAnswer).toBe(true);
    expect(normalized.correctIndex).toBeNull();
  });
});

describe('normalizeGeneratedPath', () => {
  it('normalizes all lessons in all chapters', () => {
    const path = normalizeGeneratedPath({
      title: 'Path',
      description: 'Desc',
      tagNames: ['Programación'],
      chapters: [
        {
          title: 'Chapter 1',
          order: 1,
          lessons: [
            lesson({
              type: 'interactive' as GeneratedLesson['type'],
              options: ['O(n)', 'O(1)'],
              correctAnswer: 'O(n)' as unknown as boolean,
            }),
          ],
        },
      ],
    });

    expect(path.chapters[0]?.lessons[0]?.correctIndex).toBe(0);
    expect(path.chapters[0]?.lessons[0]?.correctAnswer).toBeNull();
  });
});
