import { Inject, Injectable, Logger } from '@nestjs/common';
import { BehaviorSubject, Observable } from 'rxjs';
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
import {
  assertPathGenerationWithTrial,
  consumePathGeneration,
} from 'src/contexts/shared/domain/utils/trial-usage.helper';
import type { PathMode } from 'src/contexts/shared/domain/utils/plan-guard';
import { UNIT_OF_WORK } from 'src/contexts/shared/domain/repositories/unit-of-work.interface';
import type { IUnitOfWork } from 'src/contexts/shared/domain/repositories/unit-of-work.interface';
import { LearningPathEntity } from 'src/contexts/shared/domain/entities/learning/learning-path.entity';
import { ChapterEntity } from 'src/contexts/shared/domain/entities/learning/chapter.entity';

@Injectable()
export class PathUseCase implements IPathUseCase {
  private readonly logger = new Logger(PathUseCase.name);
  private readonly jobSubjects = new Map<string, BehaviorSubject<{ data: JobStatusDto; type?: string }>>();

  constructor(
    @Inject(LEARNING_UNIT_OF_WORK)
    private readonly uow: ILearningUnitOfWork,
    @Inject(AI_PATH_GENERATOR)
    private readonly aiGenerator: IAiPathGenerator,
    @Inject(UNIT_OF_WORK)
    private readonly sharedUow: IUnitOfWork,
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

    const user = await this.uow.users.findById(userId);
    if (user) {
      const pathMode: PathMode = mode === 'deep' ? 'deep' : 'standard';
      await assertPathGenerationWithTrial(this.sharedUow, user, pathMode);
    }

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

    const job = await this.uow.generationJobs.create({
      pathId: path.id,
      status: 'processing',
      progress: 0,
      progressLabel: 'Iniciando generación...',
      startedAt: new Date(),
    });

    // Fire in background — HTTP request returns immediately
    setImmediate(() => this.runGeneration(job.id, path.id, userId, topic, mode));

    return { jobId: job.id, pathId: path.id, status: 'processing' };
  }

  async watchJob(
    jobId: string,
    userId: string,
  ): Promise<Observable<{ data: JobStatusDto; type?: string }>> {
    const job = await this.uow.generationJobs.findByIdAndPathUserId(jobId, userId);
    if (!job) throw new JobNotFoundError();

    const dto = this.toJobStatusDto(job);

    // Already finished — emit current state then signal done so client stops reconnecting
    if (job.status === 'completed' || job.status === 'failed') {
      return new Observable((subscriber) => {
        subscriber.next({ data: dto });
        subscriber.next({ data: dto, type: 'done' });
        subscriber.complete();
      });
    }

    // Create a BehaviorSubject seeded with current state so late subscribers
    // immediately receive the last known progress instead of waiting for next event
    if (!this.jobSubjects.has(jobId)) {
      this.jobSubjects.set(jobId, new BehaviorSubject({ data: dto }));
    }
    return this.jobSubjects.get(jobId)!.asObservable();
  }

  private emit(jobId: string, dto: JobStatusDto): void {
    this.jobSubjects.get(jobId)?.next({ data: dto });
  }

  private completeJob(jobId: string): void {
    const subject = this.jobSubjects.get(jobId);
    if (subject) {
      // Emit 'done' event type so the client calls es.close() and stops reconnecting
      subject.next({ data: subject.getValue().data, type: 'done' });
      subject.complete();
      this.jobSubjects.delete(jobId);
    }
  }

  private toJobStatusDto(job: {
    id: string; status: string; pathId: string;
    progress: number; progressLabel: string | null;
    errorMsg: string | null; createdAt: Date;
  }): JobStatusDto {
    return {
      id: job.id,
      status: job.status,
      pathId: job.pathId,
      progress: job.progress ?? 0,
      progressLabel: job.progressLabel ?? null,
      errorMsg: job.errorMsg,
      createdAt: job.createdAt,
    };
  }

  private async runGeneration(
    jobId: string,
    pathId: string,
    userId: string,
    topic: string,
    mode: string,
  ): Promise<void> {
    const onProgress = async (progress: number, label: string) => {
      const updated = await this.uow.generationJobs.update(jobId, { progress, progressLabel: label });
      this.emit(jobId, this.toJobStatusDto(updated));
    };

    try {
      const generated = await this.aiGenerator.generate(
        topic,
        mode as 'standard' | 'deep',
        { onProgress },
      );

      let totalXp = 0;
      for (const chapter of generated.chapters) {
        for (const lesson of chapter.lessons) {
          totalXp += lesson.points ?? 0;
        }
      }

      await this.uow.paths.update(pathId, {
        title: generated.title,
        description: generated.description,
        totalXp,
      });

      for (let i = 0; i < generated.chapters.length; i++) {
        const genChapter = generated.chapters[i];
        const isFirst = i === 0;

        const chapterMaxXp = genChapter.lessons.reduce(
          (sum, l) => sum + (l.points ?? 0),
          0,
        );

        const chapter = await this.uow.chapters.createMany([
          {
            pathId,
            title: genChapter.title,
            order: genChapter.order,
            status: isFirst ? 'current' : 'locked',
            maxXp: chapterMaxXp,
            earnedXp: 0,
            correctAnswers: 0,
            totalQuestions: 0,
            completedAt: null,
            isExam: genChapter.isExam ?? false,
          },
        ]);

        await this.uow.lessons.createMany(
          genChapter.lessons.map((l) => ({
            chapterId: chapter[0].id,
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

      const completed = await this.uow.generationJobs.update(jobId, {
        status: 'completed',
        progress: 100,
        progressLabel: '¡Ruta generada!',
        finishedAt: new Date(),
      });
      this.emit(jobId, this.toJobStatusDto(completed));

      const user = await this.uow.users.findById(userId);
      if (user) {
        const pathMode: PathMode = mode === 'deep' ? 'deep' : 'standard';
        await consumePathGeneration(this.sharedUow, user, pathMode);
      }

      this.completeJob(jobId);
    } catch (err) {
      this.logger.error(`Path generation failed for job ${jobId}`, err);
      const failed = await this.uow.generationJobs.update(jobId, {
        status: 'failed',
        progress: 0,
        progressLabel: null,
        errorMsg: err instanceof Error ? err.message : 'Unknown error',
        finishedAt: new Date(),
      });
      this.emit(jobId, this.toJobStatusDto(failed));
      this.completeJob(jobId);
    }
  }

  async getJobStatus(jobId: string, userId: string): Promise<JobStatusDto> {
    const job = await this.uow.generationJobs.findByIdAndPathUserId(
      jobId,
      userId,
    );
    if (!job) throw new JobNotFoundError();
    return this.toJobStatusDto(job);
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

  async askTutor(params: { pathId: string; userId: string; question: string; chapterContext?: string }): Promise<{ answer: string }> {
    const path = await this.uow.paths.findByIdAndUserId(params.pathId, params.userId);
    if (!path) throw new PathNotFoundError();
    const context = `Learning path topic: "${path.topic}"\n${params.chapterContext ?? ''}`;
    const answer = await this.aiGenerator.ask(context, params.question);
    return { answer };
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
