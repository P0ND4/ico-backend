import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  IAiPathGenerator,
  GenerateOptions,
  GeneratedPath,
  GeneratedChapter,
} from '../../domain/ports/ai-path-generator.port';
import { AI_MARKDOWN_FORMATTING, AI_MARKDOWN_FORMATTING_BRIEF } from 'src/contexts/shared/constants/ai-markdown-formatting';

@Injectable()
export class DeepseekPathGeneratorService implements IAiPathGenerator {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly logger = new Logger(DeepseekPathGeneratorService.name);

  constructor(private readonly config: ConfigService) {
    this.client = new OpenAI({
      apiKey: config.get<string>('DEEPSEEK_API_KEY'),
      baseURL: config.get<string>(
        'DEEPSEEK_BASE_URL',
        'https://api.deepseek.com',
      ),
    });
    this.model = config.get<string>('DEEPSEEK_MODEL', 'deepseek-chat');
  }

  async generate(
    topic: string,
    mode: 'standard' | 'deep',
    options?: GenerateOptions,
  ): Promise<GeneratedPath> {
    const { onProgress, learnerContext } = options ?? {};

    this.logger.log(`Generating ${mode} learning path for topic: ${topic}`);

    // ── Phase 1: structure (titles + lesson stubs, no content) ──────────────
    await onProgress?.(5, 'Diseñando la estructura del curso...');
    const structure = await this.generateStructure(topic, mode, learnerContext);
    const total = structure.chapters.length;
    this.logger.log(`Structure ready: ${total} chapters`);
    await onProgress?.(15, `Estructura lista: ${total} capítulos`);

    // ── Phase 2: content per chapter — all in parallel ───────────────────────
    let completed = 0;
    const chaptersWithContent = await Promise.all(
      structure.chapters.map(async (chapter) => {
        const filled = await this.generateChapterContent(
          chapter,
          structure.title,
          topic,
          mode,
          learnerContext,
        );
        completed++;
        const pct = Math.round(15 + (80 * completed) / total);
        await onProgress?.(pct, `Generando capítulo ${completed} de ${total}: ${chapter.title}`);
        return filled;
      }),
    );

    // Re-index to ensure sequential orders regardless of AI output
    const chapters = chaptersWithContent.map((ch, i) => ({
      ...ch,
      order: i + 1,
      lessons: (ch.lessons ?? []).map((l, j) => ({ ...l, order: j + 1 })),
    }));

    this.logger.log(`Generation complete: ${chapters.length} chapters, topic: "${topic}"`);

    return {
      title: structure.title,
      description: structure.description,
      tagNames: structure.tagNames,
      chapters,
    };
  }

  // ── Phase 1: generate path structure with empty lesson content ─────────────

  private appendLearnerContext(prompt: string, learnerContext?: string): string {
    if (!learnerContext) return prompt;
    return `${prompt}\n\nPersonalize for this learner:\n${learnerContext}`;
  }

  private async generateStructure(
    topic: string,
    mode: 'standard' | 'deep',
    learnerContext?: string,
  ): Promise<GeneratedPath> {
    const systemPrompt = `You are an expert educational content creator designing learning path structures.

Generate a structured learning path in JSON format:
{
  "title": "string",
  "description": "string",
  "tagNames": ["string"],
  "chapters": [
    {
      "title": "string",
      "order": number,
      "isExam": boolean (default false — set true ONLY for the optional final exam chapter),
      "lessons": [
        {
          "title": "string or null",
          "type": "theory|concept|example|multiple_choice|true_false|open_ended",
          "content": "",
          "question": "string or null (required for multiple_choice, true_false, open_ended)",
          "options": ["string"] or null (multiple_choice only, exactly 4 options)",
          "correctIndex": number or null (0-based, multiple_choice only)",
          "correctAnswer": boolean or null (true_false only)",
          "points": number (10 for theory/concept/example, 20 for interactive)",
          "order": number
        }
      ]
    }
  ]
}

Rules:
- tagNames from: Ciencias, Historia, Programación, Matemáticas, Literatura, Filosofía, Arte, Economía
- Chapters: as many as the topic genuinely needs — no limit
- Lessons per chapter: at least 1 theory/concept, 1 example, 4–6 interactive questions (multiple_choice or true_false)
- content MUST be "" (empty string) — content is generated separately
- For interactive lessons: question, options/correctIndex/correctAnswer MUST be filled in now
- OPTIONAL exam chapter: you MAY add one final chapter with isExam:true if the topic benefits from a final assessment. Exam chapters contain ONLY open_ended lessons (3–5 open questions, no content, no options). Students must score ≥70/100 to pass.
- If you include an exam chapter, it must be the last chapter
- open_ended lessons: only question field is required; content/options/correctIndex/correctAnswer must be null
- Language: same as the topic`;

    const userPrompt = this.appendLearnerContext(
      mode === 'deep'
        ? `Design the COMPLETE structure for a deep, comprehensive learning path about: "${topic}". Cover all prerequisites, all major topics, advanced concepts. Do not skip steps. Set content = "" for all lessons.`
        : `Design the structure for a standard learning path about: "${topic}". Assess what the learner likely knows and build from there. Set content = "" for all lessons.`,
      learnerContext,
    );

    const response = await this.callApi(systemPrompt, userPrompt);
    const choice = response.choices[0];
    const raw = choice?.message?.content;

    if (!raw) throw new Error('DeepSeek returned empty response for structure');

    if (choice.finish_reason === 'length') {
      // Structure truncated — salvage and continue
      this.logger.warn(`Structure response truncated (${raw.length} chars). Salvaging...`);
      const partial = this.salvagePartial(raw);
      if (!partial.chapters.length) {
        throw new Error('Structure response truncated before any chapter could be extracted');
      }
      // Continue requesting more structure chapters
      return await this.completeStructure(topic, mode, partial, raw.length);
    }

    try {
      return JSON.parse(raw) as GeneratedPath;
    } catch (err) {
      this.logger.error(`Structure parse failed. length=${raw.length}`);
      throw new Error(`Failed to parse structure: ${(err as Error).message}`);
    }
  }

  private async completeStructure(
    topic: string,
    mode: string,
    partial: Partial<GeneratedPath> & { chapters: GeneratedPath['chapters'] },
    _prevLength: number,
  ): Promise<GeneratedPath> {
    const allChapters = [...partial.chapters];
    const systemPrompt = `You are continuing to generate a learning path structure. Return ONLY a JSON object with a "chapters" array. Set content = "" for all lessons. Include question/options/correctAnswer for interactive lessons.`;

    for (let iter = 0; iter < 4; iter++) {
      const chapterList = allChapters.map((c) => `${c.order}. ${c.title}`).join('\n');
      const nextOrder = allChapters.length + 1;

      const contPrompt = `Continue the ${mode} structure for "${partial.title ?? topic}".

Already defined chapters:
${chapterList}

Generate remaining chapters from order ${nextOrder}. Return {"chapters": [...]}`;

      const response = await this.callApi(systemPrompt, contPrompt);
      const choice = response.choices[0];
      const raw = choice?.message?.content;
      if (!raw) break;

      if (choice.finish_reason !== 'length') {
        try {
          const parsed = JSON.parse(raw) as { chapters?: GeneratedPath['chapters'] };
          allChapters.push(...(parsed.chapters ?? []));
        } catch { /* keep what we have */ }
        break;
      }

      const salvaged = this.salvageChapters(raw);
      if (!salvaged.length) break;
      allChapters.push(...salvaged);
    }

    return {
      title: partial.title ?? topic,
      description: partial.description ?? '',
      tagNames: partial.tagNames ?? [],
      chapters: allChapters,
    };
  }

  // ── Phase 2: generate full content for one chapter ─────────────────────────

  private async generateChapterContent(
    chapter: GeneratedChapter,
    pathTitle: string,
    topic: string,
    mode: 'standard' | 'deep' = 'standard',
    learnerContext?: string,
  ): Promise<GeneratedChapter> {
    const lessonStubs = (chapter.lessons ?? []).map((l) => ({
      title: l.title,
      type: l.type,
      content: '',
      question: l.question,
      options: l.options,
      correctIndex: l.correctIndex,
      correctAnswer: l.correctAnswer,
      points: l.points,
      order: l.order,
    }));

    for (let attempt = 0; attempt < 3; attempt++) {
      const filled = await this.requestChapterLessonsContent(
        chapter,
        pathTitle,
        mode,
        lessonStubs,
        attempt,
        learnerContext,
      );
      if (filled && this.hasRequiredReadingContent(filled, lessonStubs)) {
        return { ...chapter, lessons: filled };
      }
      this.logger.warn(
        `Chapter ${chapter.order} "${chapter.title}" attempt ${attempt + 1}/3 — incomplete content`,
      );
    }

    this.logger.warn(
      `Falling back to per-lesson generation for chapter ${chapter.order} "${chapter.title}"`,
    );
    const fallbackLessons = await this.generateChapterContentPerLesson(
      chapter,
      pathTitle,
      mode,
      lessonStubs,
      learnerContext,
    );
    return { ...chapter, lessons: fallbackLessons };
  }

  private async requestChapterLessonsContent(
    chapter: GeneratedChapter,
    pathTitle: string,
    mode: 'standard' | 'deep',
    lessonStubs: GeneratedChapter['lessons'],
    attempt: number,
    learnerContext?: string,
  ): Promise<GeneratedChapter['lessons'] | null> {
    const modeInstructions = this.buildModeInstructions(mode);
    const systemPrompt = `You are filling in the lesson content for a learning path chapter.

Return ONLY a JSON object: {"lessons": [...]}

Keep all lesson fields exactly as provided. Only fill in the "content" field for each lesson.

${modeInstructions}

${AI_MARKDOWN_FORMATTING}
- Escape special characters inside JSON strings correctly (use \\n for newlines, \\" for quotes)
- Language: same as the chapter title`;

    const retryHint =
      attempt > 0
        ? '\n\nIMPORTANT: Your previous response was invalid or incomplete JSON. Return ONLY valid JSON with no markdown fences.'
        : '';

    const userPrompt = this.appendLearnerContext(
      `Path: "${pathTitle}"
Chapter ${chapter.order}: "${chapter.title}"

Fill in the content for each lesson below:
${JSON.stringify(lessonStubs, null, 2)}${retryHint}`,
      learnerContext,
    );

    const response = await this.callApi(systemPrompt, userPrompt);
    const choice = response.choices[0];
    const raw = choice?.message?.content;

    if (!raw) return null;

    if (choice?.finish_reason === 'length') {
      this.logger.warn(
        `Content truncated for chapter ${chapter.order} "${chapter.title}" (${raw.length} chars)`,
      );
    }

    const parsedLessons = this.parseLessonsPayload(raw);
    if (!parsedLessons.length) return null;

    return this.mergeLessonContent(lessonStubs, parsedLessons);
  }

  private async generateChapterContentPerLesson(
    chapter: GeneratedChapter,
    pathTitle: string,
    mode: 'standard' | 'deep',
    lessonStubs: GeneratedChapter['lessons'],
    learnerContext?: string,
  ): Promise<GeneratedChapter['lessons']> {
    const readingTypes = new Set(['theory', 'concept', 'example']);

    return Promise.all(
      lessonStubs.map(async (stub) => {
        if (stub.content?.trim()) return stub;
        if (!readingTypes.has(stub.type)) return stub;

        const content = await this.generateSingleLessonContent(
          stub,
          chapter.title,
          pathTitle,
          mode,
          learnerContext,
        );
        return content ? { ...stub, content } : stub;
      }),
    );
  }

  private async generateSingleLessonContent(
    lesson: GeneratedChapter['lessons'][number],
    chapterTitle: string,
    pathTitle: string,
    mode: 'standard' | 'deep',
    learnerContext?: string,
  ): Promise<string | null> {
    const systemPrompt = `You write lesson content for a learning app. Return ONLY a JSON object: {"content": "..."}.
Use markdown. ${this.buildModeInstructions(mode)}
Language: same as the chapter title.`;

    const userPrompt = this.appendLearnerContext(
      `Path: "${pathTitle}"
Chapter: "${chapterTitle}"
Lesson (${lesson.type}): "${lesson.title ?? 'Sin título'}"

Write the content for this lesson.`,
      learnerContext,
    );

    try {
      const response = await this.callApi(systemPrompt, userPrompt);
      const raw = response.choices[0]?.message?.content;
      if (!raw) return null;

      const parsed = this.parseContentOnlyPayload(raw);
      return parsed?.trim() || null;
    } catch (err) {
      this.logger.warn(
        `Single-lesson content failed (${lesson.type} order ${lesson.order}): ${(err as Error).message}`,
      );
      return null;
    }
  }

  private buildModeInstructions(mode: 'standard' | 'deep'): string {
    return mode === 'deep'
      ? `Depth level: DEEP — write as if this is a technical reference for someone who wants to truly master the subject.
- Theory/concept lessons: explain the WHY behind every rule, include edge cases, common pitfalls, and mental models
- Example lessons: show multiple approaches, compare trade-offs, include a full worked example with every step explained
- Interactive lessons: write questions that require reasoning, not just recall; include a detailed explanation in the content field for why the correct answer is right and why the others are wrong
- Aim for thorough, dense content — do not simplify unless the concept genuinely requires it`
      : `Depth level: STANDARD — clear, practical explanations that get the learner productive quickly.
- Theory/concept lessons: explain the concept with one good analogy and practical context
- Example lessons: one clear worked example with step-by-step solution
- Interactive lessons: straightforward questions that reinforce the key concept`;
  }

  private parseLessonsPayload(raw: string): GeneratedChapter['lessons'] {
    const cleaned = this.extractJsonPayload(raw);

    try {
      const parsed = JSON.parse(cleaned) as { lessons?: GeneratedChapter['lessons'] };
      if (parsed.lessons?.length) return parsed.lessons;
    } catch {
      /* try salvage */
    }

    return this.salvageJsonArray<GeneratedChapter['lessons'][number]>(cleaned, 'lessons');
  }

  private parseContentOnlyPayload(raw: string): string | null {
    const cleaned = this.extractJsonPayload(raw);
    try {
      const parsed = JSON.parse(cleaned) as { content?: string };
      return typeof parsed.content === 'string' ? parsed.content : null;
    } catch {
      return cleaned.length > 20 ? cleaned : null;
    }
  }

  private extractJsonPayload(raw: string): string {
    let text = raw.trim();
    const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/im.exec(text);
    if (fenced) return fenced[1].trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end > start) return text.slice(start, end + 1);
    return text;
  }

  private mergeLessonContent(
    stubs: GeneratedChapter['lessons'],
    filled: GeneratedChapter['lessons'],
  ): GeneratedChapter['lessons'] {
    return stubs.map((stub, index) => {
      const match =
        filled.find((l) => l.order === stub.order) ??
        filled[index];
      if (!match) return stub;

      const content = match.content?.trim() ? match.content : stub.content;
      return { ...stub, content };
    });
  }

  private hasRequiredReadingContent(
    lessons: GeneratedChapter['lessons'],
    stubs: GeneratedChapter['lessons'],
  ): boolean {
    const readingTypes = new Set(['theory', 'concept', 'example']);
    for (const stub of stubs) {
      if (!readingTypes.has(stub.type)) continue;
      const match =
        lessons.find((l) => l.order === stub.order) ??
        lessons[stubs.indexOf(stub)];
      if (!match?.content?.trim()) return false;
    }
    return true;
  }

  private salvageJsonArray<T>(raw: string, key: string): T[] {
    const pattern = new RegExp(`"${key}"\\s*:\\s*\\[`);
    const match = pattern.exec(raw);
    if (!match) return [];

    const arrayStart = raw.indexOf('[', match.index);
    const items: T[] = [];
    let i = arrayStart + 1;
    let depth = 0;
    let objStart = -1;

    while (i < raw.length) {
      const ch = raw[i];
      if (ch === '{') {
        if (depth === 0) objStart = i;
        depth++;
      } else if (ch === '}') {
        depth--;
        if (depth === 0 && objStart !== -1) {
          try {
            items.push(JSON.parse(raw.slice(objStart, i + 1)) as T);
          } catch {
            /* skip malformed */
          }
          objStart = -1;
        }
      }
      i++;
    }

    return items;
  }

  async ask(context: string, question: string, learnerContext?: string): Promise<string> {
    let systemContent = `You are a helpful and concise tutor. The student is learning the following:\n\n${context}\n\nAnswer clearly in the same language the student writes in. Be brief and encouraging.\n\n${AI_MARKDOWN_FORMATTING_BRIEF}`;
    if (learnerContext) {
      systemContent += `\n\nAdapt your teaching to this learner profile:\n${learnerContext}`;
    }
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemContent,
      },
      { role: 'user', content: question },
    ];
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    });
    return response.choices[0]?.message?.content ?? '';
  }

  // ── Shared ─────────────────────────────────────────────────────────────────

  private callApi(
    systemContent: string,
    userContent: string,
  ): Promise<OpenAI.Chat.ChatCompletion> {
    return this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 8192,
    });
  }

  private salvagePartial(
    raw: string,
  ): Partial<GeneratedPath> & { chapters: GeneratedPath['chapters'] } {
    const chapters = this.salvageChapters(raw);
    let title: string | undefined;
    let description: string | undefined;
    let tagNames: string[] | undefined;

    const chaptersMatch = /"chapters"\s*:\s*\[/.exec(raw);
    if (chaptersMatch) {
      try {
        const headerJson = raw.slice(0, chaptersMatch.index) + '"chapters": []}';
        const header = JSON.parse(headerJson);
        title = header.title;
        description = header.description;
        tagNames = header.tagNames;
      } catch { /* optional */ }
    }

    return { title, description, tagNames, chapters };
  }

  private salvageChapters(raw: string): GeneratedPath['chapters'] {
    return this.salvageJsonArray<GeneratedPath['chapters'][number]>(raw, 'chapters');
  }
}
