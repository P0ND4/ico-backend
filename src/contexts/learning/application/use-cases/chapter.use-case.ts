import { Inject, Injectable } from '@nestjs/common';
import { LEARNING_UNIT_OF_WORK } from '../../domain/unit-of-work.interface';
import type { ILearningUnitOfWork } from '../../domain/unit-of-work.interface';
import type {
  IChapterUseCase,
  CompleteChapterParams,
  CompleteChapterResult,
} from '../../domain/contracts/i-chapter.use-case';
import { ChapterDetailDto } from '../dtos/chapter-detail.dto';
import { LessonDto } from '../dtos/lesson.dto';
import { ChapterNotFoundError } from '../../domain/errors/chapter-not-found.error';
import { ChapterLockedError } from '../../domain/errors/chapter-locked.error';
import { PathNotFoundError } from '../../domain/errors/path-not-found.error';
import { UserNotFoundError } from 'src/contexts/user/domain/errors/auth/user-not-found.error';
import { ChapterEntity } from 'src/contexts/shared/domain/entities/learning/chapter.entity';
import { LessonEntity } from 'src/contexts/shared/domain/entities/learning/lesson.entity';

@Injectable()
export class ChapterUseCase implements IChapterUseCase {
  constructor(
    @Inject(LEARNING_UNIT_OF_WORK)
    private readonly uow: ILearningUnitOfWork,
  ) {}

  async get(
    pathId: string,
    chapterId: string,
    userId: string,
  ): Promise<ChapterDetailDto> {
    const path = await this.uow.paths.findByIdAndUserId(pathId, userId);
    if (!path) throw new PathNotFoundError();

    const chapter = await this.uow.chapters.findByIdAndPathId(
      chapterId,
      pathId,
    );
    if (!chapter) throw new ChapterNotFoundError();

    const lessons = await this.uow.lessons.findAllByChapterId(chapterId);
    return this.toDto(chapter, lessons);
  }

  async complete(
    params: CompleteChapterParams,
  ): Promise<CompleteChapterResult> {
    const {
      pathId,
      chapterId,
      userId,
      earnedXp,
      correctCount,
      totalQuestions,
    } = params;

    // 1. Verify path belongs to user
    const path = await this.uow.paths.findByIdAndUserId(pathId, userId);
    if (!path) throw new PathNotFoundError();

    // 2. Verify chapter belongs to path
    const chapter = await this.uow.chapters.findByIdAndPathId(
      chapterId,
      pathId,
    );
    if (!chapter) throw new ChapterNotFoundError();

    // 3. Check chapter is not locked
    if (chapter.status === 'locked') throw new ChapterLockedError();

    // 4. Mark chapter as completed
    const updatedChapter = await this.uow.chapters.update(chapterId, {
      status: 'completed',
      earnedXp,
      correctAnswers: correctCount,
      totalQuestions,
      completedAt: new Date(),
    });

    // 5. Update path earnedXp
    await this.uow.paths.update(pathId, {
      earnedXp: path.earnedXp + earnedXp,
    });

    // 6. Find next chapter
    let nextChapterUnlocked = false;
    let pathCompleted = false;

    const nextChapter = await this.uow.chapters.findByPathIdAndOrder(
      pathId,
      chapter.order + 1,
    );
    if (nextChapter) {
      if (nextChapter.status !== 'completed') {
        await this.uow.chapters.update(nextChapter.id, { status: 'current' });
        nextChapterUnlocked = true;
      }
    } else {
      // No more chapters — path is complete
      await this.uow.paths.update(pathId, { status: 'completed' });
      pathCompleted = true;
    }

    // 7. Update user XP and level
    const user = await this.uow.users.findById(userId);
    if (!user) throw new UserNotFoundError();

    const newXp = user.xp + earnedXp;

    const allLevels = await this.uow.xpLevels.findAll();
    const levelRecord = allLevels
      .filter((xl) => xl.minXp <= newXp)
      .sort((a, b) => b.level - a.level)[0];

    await this.uow.users.update(userId, {
      xp: newXp,
      ...(levelRecord ? { level: levelRecord.level } : {}),
    });

    // 8. Upsert UserStats
    let stats = await this.uow.userStats.findByUserId(userId);
    if (!stats) {
      stats = await this.uow.userStats.create({ userId });
    }
    stats.chaptersCompleted += 1;
    stats.correctAnswers += correctCount;
    stats.totalQuestionAnswers += totalQuestions;
    if (pathCompleted) {
      stats.pathsCompleted += 1;
    }
    await this.uow.userStats.save(stats);

    return { chapter: updatedChapter!, nextChapterUnlocked, pathCompleted };
  }

  private toDto(
    chapter: ChapterEntity,
    lessons: LessonEntity[],
  ): ChapterDetailDto {
    return {
      id: chapter.id,
      pathId: chapter.pathId,
      title: chapter.title,
      order: chapter.order,
      status: chapter.status,
      maxXp: chapter.maxXp,
      earnedXp: chapter.earnedXp,
      correctAnswers: chapter.correctAnswers,
      totalQuestions: chapter.totalQuestions,
      completedAt: chapter.completedAt,
      createdAt: chapter.createdAt,
      lessons: lessons.map((l) => this.toLessonDto(l)),
    };
  }

  private toLessonDto(lesson: LessonEntity): LessonDto {
    return {
      id: lesson.id,
      chapterId: lesson.chapterId,
      type: lesson.type,
      title: lesson.title,
      content: lesson.content,
      question: lesson.question,
      options: lesson.options,
      correctIndex: lesson.correctIndex,
      correctAnswer: lesson.correctAnswer,
      points: lesson.points,
      order: lesson.order,
      createdAt: lesson.createdAt,
    };
  }
}
