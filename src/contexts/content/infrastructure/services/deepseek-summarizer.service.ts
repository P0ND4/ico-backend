import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { IAiSummarizer } from '../../domain/ports/ai-summarizer.port';
import { AI_MARKDOWN_FORMATTING_BRIEF } from 'src/contexts/shared/constants/ai-markdown-formatting';

@Injectable()
export class DeepseekSummarizerService implements IAiSummarizer {
  private readonly client: OpenAI;
  private readonly model: string;

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

  async summarize(text: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content:
            `You are an expert at creating critical, structured summaries. Generate a comprehensive summary that captures the key ideas, arguments, and conclusions. Respond in the same language as the input text.\n\n${AI_MARKDOWN_FORMATTING_BRIEF}`,
        },
        {
          role: 'user',
          content: `Generate a critical summary of the following text:\n\n${text}`,
        },
      ],
      temperature: 0.5,
    });

    return response.choices[0]?.message?.content ?? '';
  }
}
