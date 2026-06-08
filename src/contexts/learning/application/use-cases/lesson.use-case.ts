import { Inject, Injectable } from '@nestjs/common';
import { LEARNING_UNIT_OF_WORK } from '../../domain/unit-of-work.interface';
import type { ILearningUnitOfWork } from '../../domain/unit-of-work.interface';
import type {
  ILessonUseCase,
  RecordAnswerParams,
  RecordAnswerResult,
} from '../../domain/contracts/i-lesson.use-case';
import { LessonNotFoundError } from '../../domain/errors/lesson-not-found.error';

const INTERACTIVE_TYPES = ['multiple_choice', 'true_false'];

@Injectable()
export class LessonUseCase implements ILessonUseCase {
  constructor(
    @Inject(LEARNING_UNIT_OF_WORK)
    private readonly uow: ILearningUnitOfWork,
  ) {}

  async recordAnswer(params: RecordAnswerParams): Promise<RecordAnswerResult> {
    const {
      chapterId,
      lessonId,
      userId,
      selectedIndex,
      selectedAnswer,
      isCorrect,
    } = params;

    // 1. Verify lesson exists in chapter
    const lesson = await this.uow.lessons.findByIdAndChapterId(
      lessonId,
      chapterId,
    );
    if (!lesson) throw new LessonNotFoundError();

    const isInteractive = INTERACTIVE_TYPES.includes(lesson.type);
    const pointsEarned = isCorrect ? lesson.points : 0;

    // 2. Create answer record
    const lessonAnswer = await this.uow.lessonAnswers.create({
      userId,
      lessonId,
      selectedIndex: selectedIndex ?? null,
      selectedAnswer: selectedAnswer ?? null,
      isCorrect,
      pointsEarned,
    });

    // 3. Update UserStats
    let stats = await this.uow.userStats.findByUserId(userId);
    if (!stats) {
      stats = await this.uow.userStats.create({ userId });
    }
    stats.lessonsCompleted += 1;
    if (isInteractive) {
      if (isCorrect) stats.correctAnswers += 1;
      stats.totalQuestionAnswers += 1;
    }
    await this.uow.userStats.save(stats);

    return { lessonAnswer };
  }
}
