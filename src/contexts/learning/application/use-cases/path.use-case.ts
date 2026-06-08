import { Inject, Injectable, Logger } from '@nestjs/common';
import { LEARNING_UNIT_OF_WORK } from '../../domain/unit-of-work.interface';
import type { ILearningUnitOfWork } from '../../domain/unit-of-work.interface';
import { AI_PATH_GENERATOR } from '../../domain/ports/ai-path-generator.port';
import type { IAiPathGenerator } from '../../domain/ports/ai-path-generator.port';
import type {
  IPathUseCase,
  GeneratePathParams,
  UpdatePathParams,
} from '../../domain/contracts/i-path.use-case';
import { PathListItemDto } from '../dtos/path-list-item.dto';
import { PathDetailDto } from '../dtos/path-detail.dto';
import { ChapterSummaryDto } from '../dtos/chapter-summary.dto';
import { JobStatusDto } from '../dtos/job-status.dto';
import { PathNotFoundError } from '../../domain/errors/path-not-found.error';
import { JobNotFoundError } from '../../domain/errors/job-not-found.error';
import { LearningPathEntity } from 'src/contexts/shared/domain/entities/learning/learning-path.entity';
import { ChapterEntity } from 'src/contexts/shared/domain/entities/learning/chapter.entity';

@Injectable()
export class PathUseCase implements IPathUseCase {
  private readonly logger = new Logger(PathUseCase.name);

  constructor(
    @Inject(LEARNING_UNIT_OF_WORK)
    private readonly uow: ILearningUnitOfWork,
    @Inject(AI_PATH_GENERATOR)
    private readonly aiGenerator: IAiPathGenerator,
  ) {}

  async list(userId: string): Promise<PathListItemDto[]> {
    const paths = await this.uow.paths.findAllByUserId(userId);

    const result: PathListItemDto[] = [];
    for (const path of paths) {
      const chapters = await this.uow.chapters.findAllByPathId(path.id);
      result.push(this.toListItemDto(path, chapters));
    }
    return result;
  }

  async generate(
    params: GeneratePathParams,
  ): Promise<{ jobId: string; pathId: string; status: string }> {
    const { userId, topic, mode } = params;

    // 1. Create path stub
    const path = await this.uow.paths.create({
      userId,
      topic,
      mode,
      title: 'Generating...',
      description: null,
      status: 'active',
      totalXp: 0,
      earnedXp: 0,
    });

    // 2. Create job in pending state
    const job = await this.uow.generationJobs.create({
      pathId: path.id,
      status: 'pending',
    });

    try {
      // 3. Generate synchronously via AI
      const generated = await this.aiGenerator.generate(topic, mode);

      // 4. Compute totalXp
      let totalXp = 0;
      for (const chapter of generated.chapters) {
        for (const lesson of chapter.lessons) {
          totalXp += lesson.points ?? 0;
        }
      }

      // 5. Update path with generated data
      await this.uow.paths.update(path.id, {
        title: generated.title,
        description: generated.description,
        totalXp,
      });

      // 6. Save chapters and lessons
      for (let i = 0; i < generated.chapters.length; i++) {
        const genChapter = generated.chapters[i];
        const isFirst = i === 0;

        const chapterMaxXp = genChapter.lessons.reduce(
          (sum, l) => sum + (l.points ?? 0),
          0,
        );

        const chapter = await this.uow.chapters.createMany([
          {
            pathId: path.id,
            title: genChapter.title,
            order: genChapter.order,
            status: isFirst ? 'current' : 'locked',
            maxXp: chapterMaxXp,
            earnedXp: 0,
            correctAnswers: 0,
            totalQuestions: 0,
            completedAt: null,
          },
        ]);

        const chapterEntity = chapter[0];

        await this.uow.lessons.createMany(
          genChapter.lessons.map((l) => ({
            chapterId: chapterEntity.id,
            type: l.type,
            title: l.title,
            content: l.content,
            question: l.question,
            options: l.options,
            correctIndex: l.correctIndex,
            correctAnswer: l.correctAnswer,
            points: l.points,
            order: l.order,
          })),
        );
      }

      // 7. Update job to completed
      await this.uow.generationJobs.update(job.id, {
        status: 'completed',
        finishedAt: new Date(),
      });

      return { jobId: job.id, pathId: path.id, status: 'completed' };
    } catch (err) {
      this.logger.error(`Path generation failed for job ${job.id}`, err);
      await this.uow.generationJobs.update(job.id, {
        status: 'failed',
        errorMsg: err instanceof Error ? err.message : 'Unknown error',
        finishedAt: new Date(),
      });
      throw err;
    }
  }

  async getJobStatus(jobId: string, userId: string): Promise<JobStatusDto> {
    const job = await this.uow.generationJobs.findByIdAndPathUserId(
      jobId,
      userId,
    );
    if (!job) throw new JobNotFoundError();

    return {
      id: job.id,
      status: job.status,
      pathId: job.pathId,
      errorMsg: job.errorMsg,
      createdAt: job.createdAt,
    };
  }

  async get(id: string, userId: string): Promise<PathDetailDto> {
    const path = await this.uow.paths.findByIdAndUserId(id, userId);
    if (!path) throw new PathNotFoundError();

    const chapters = await this.uow.chapters.findAllByPathId(id);
    return this.toDetailDto(path, chapters);
  }

  async update(params: UpdatePathParams): Promise<PathDetailDto> {
    const { id, userId, ...data } = params;

    const existing = await this.uow.paths.findByIdAndUserId(id, userId);
    if (!existing) throw new PathNotFoundError();

    await this.uow.paths.update(id, data);

    const updated = await this.uow.paths.findByIdAndUserId(id, userId);
    if (!updated) throw new PathNotFoundError();

    const chapters = await this.uow.chapters.findAllByPathId(id);
    return this.toDetailDto(updated, chapters);
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.uow.paths.findByIdAndUserId(id, userId);
    if (!existing) throw new PathNotFoundError();

    await this.uow.paths.delete(id);
  }

  private toListItemDto(
    path: LearningPathEntity,
    chapters: ChapterEntity[],
  ): PathListItemDto {
    const completedChapterCount = chapters.filter(
      (c) => c.status === 'completed',
    ).length;
    return {
      id: path.id,
      title: path.title,
      description: path.description,
      mode: path.mode,
      status: path.status,
      totalXp: path.totalXp,
      earnedXp: path.earnedXp,
      chapterCount: chapters.length,
      completedChapterCount,
      createdAt: path.createdAt,
    };
  }

  private toDetailDto(
    path: LearningPathEntity,
    chapters: ChapterEntity[],
  ): PathDetailDto {
    const completedChapterCount = chapters.filter(
      (c) => c.status === 'completed',
    ).length;

    const chapterSummaries: ChapterSummaryDto[] = chapters.map((c) => ({
      id: c.id,
      title: c.title,
      order: c.order,
      status: c.status,
      maxXp: c.maxXp,
      earnedXp: c.earnedXp,
      completedAt: c.completedAt,
    }));

    return {
      id: path.id,
      title: path.title,
      description: path.description,
      topic: path.topic,
      mode: path.mode,
      status: path.status,
      totalXp: path.totalXp,
      earnedXp: path.earnedXp,
      chapterCount: chapters.length,
      completedChapterCount,
      createdAt: path.createdAt,
      chapters: chapterSummaries,
    };
  }
}
