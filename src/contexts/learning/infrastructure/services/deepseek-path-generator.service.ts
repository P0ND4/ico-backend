import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  IAiPathGenerator,
  GeneratedPath,
} from '../../domain/ports/ai-path-generator.port';

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
  ): Promise<GeneratedPath> {
    const chapterCount = 5;
    const lessonCount = mode === 'deep' ? 6 : 4;

    const systemPrompt = `You are an expert educational content creator. Generate a structured learning path in JSON format.
The JSON must follow this exact schema:
{
  "title": "string",
  "description": "string",
  "tagNames": ["string"],
  "chapters": [
    {
      "title": "string",
      "order": number,
      "lessons": [
        {
          "title": "string or null",
          "type": "theory|concept|example|multiple_choice|true_false",
          "content": "string (explanation or text)",
          "question": "string or null (only for multiple_choice and true_false)",
          "options": ["string"] or null (only for multiple_choice, exactly 4 options),
          "correctIndex": number or null (0-based, only for multiple_choice),
          "correctAnswer": boolean or null (only for true_false),
          "points": number (10 for theory/concept/example, 20 for multiple_choice/true_false),
          "order": number
        }
      ]
    }
  ]
}
Rules:
- tagNames must be chosen from: Ciencias, Historia, Programación, Matemáticas, Literatura, Filosofía, Arte, Economía
- Generate exactly ${chapterCount} chapters, each with exactly ${lessonCount} lessons
- Mix lesson types: include at least 1 theory/concept, 1 example, and 2 interactive (multiple_choice or true_false) per chapter
- Content must be educational, accurate, and in the same language as the topic`;

    const userPrompt = `Create a ${mode === 'deep' ? 'deep, comprehensive' : 'standard'} learning path about: ${topic}`;

    this.logger.log(`Generating ${mode} learning path for topic: ${topic}`);

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error('DeepSeek returned empty response');

    return JSON.parse(raw) as GeneratedPath;
  }
}
