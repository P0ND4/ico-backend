import { Inject, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChapterEntity } from 'src/contexts/shared/domain/entities/learning/chapter.entity';
import { LessonEntity } from 'src/contexts/shared/domain/entities/learning/lesson.entity';
import { ExamResultEntity } from 'src/contexts/shared/domain/entities/learning/exam-result.entity';
import { LEARNING_UNIT_OF_WORK } from '../../domain/unit-of-work.interface';
import type { ILearningUnitOfWork } from '../../domain/unit-of-work.interface';
import { assertAiAccess } from 'src/contexts/shared/domain/utils/plan-guard';
import type {
  IExamUseCase,
  EvaluateExamParams,
  EvaluateExamResult,
  ExamFeedback,
} from '../../domain/contracts/i-exam.use-case';

const PASS_THRESHOLD = 70;

@Injectable()
export class ExamUseCase implements IExamUseCase {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(
    @InjectRepository(ChapterEntity)
    private readonly chapters: Repository<ChapterEntity>,
    @InjectRepository(LessonEntity)
    private readonly lessons: Repository<LessonEntity>,
    @InjectRepository(ExamResultEntity)
    private readonly examResults: Repository<ExamResultEntity>,
    @Inject(LEARNING_UNIT_OF_WORK)
    private readonly uow: ILearningUnitOfWork,
    private readonly config: ConfigService,
  ) {
    this.client = new OpenAI({
      apiKey: config.get<string>('DEEPSEEK_API_KEY'),
      baseURL: config.get<string>('DEEPSEEK_BASE_URL', 'https://api.deepseek.com'),
    });
    this.model = config.get<string>('DEEPSEEK_MODEL', 'deepseek-chat');
  }

  async evaluate(params: EvaluateExamParams): Promise<EvaluateExamResult> {
    const { chapterId, userId, answers } = params;

    const user = await this.uow.users.findById(userId);
    if (user) {
      const plan = await this.uow.subscriptionPlans.findByCode(user.planCode ?? 'free');
      assertAiAccess(user, plan);
    }

    const chapter = await this.chapters.findOne({ where: { id: chapterId } });
    if (!chapter) throw new NotFoundException('Chapter not found');
    if (!chapter.isExam) throw new ForbiddenException('This chapter is not an exam');

    const lessonList = await this.lessons.find({ where: { chapterId } });
    const prompt = this.buildEvalPrompt(chapter.title, lessonList, answers);

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are an educational AI evaluator. Respond ONLY with valid JSON matching the given schema.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as {
      score?: number;
      strengths?: string[];
      weaknesses?: string[];
      recommendations?: string[];
    };

    const score = Math.min(100, Math.max(0, Math.round(parsed.score ?? 0)));
    const passed = score >= PASS_THRESHOLD;
    const feedback: ExamFeedback = {
      strengths: parsed.strengths ?? [],
      weaknesses: parsed.weaknesses ?? [],
      recommendations: parsed.recommendations ?? [],
    };

    await this.examResults.upsert(
      { userId, chapterId, score, passed, feedback },
      { conflictPaths: ['userId', 'chapterId'] },
    );

    return { score, passed, feedback };
  }

  private buildEvalPrompt(
    chapterTitle: string,
    lessons: LessonEntity[],
    answers: Array<{ lessonId: string; text: string }>,
  ): string {
    const qaLines = lessons
      .filter((l) => l.type === 'open_ended')
      .map((l) => {
        const userAnswer = answers.find((a) => a.lessonId === l.id)?.text ?? '(sin respuesta)';
        return `Q: ${l.question}\nA: ${userAnswer}`;
      })
      .join('\n\n');

    return `Evaluate the following student answers for the exam chapter "${chapterTitle}".

${qaLines}

Return a JSON object with:
- "score": integer 0-100 based on overall correctness and depth
- "strengths": array of 1-3 short strings (what the student did well)
- "weaknesses": array of 1-3 short strings (gaps to improve)
- "recommendations": array of 1-2 short strings (concrete next steps)

Respond in the same language as the questions. Be fair but rigorous.`;
  }
}
