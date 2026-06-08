import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { IAiTutor, ChatMessage } from '../../domain/ports/ai-tutor.port';

@Injectable()
export class DeepseekTutorService implements IAiTutor {
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

  async chat(history: ChatMessage[], userMessage: string): Promise<string> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content:
          "You are AutoLearner's AI tutor. Help users understand concepts clearly and concisely. Respond in the same language the user writes in.",
      },
      ...history.map((m) => ({
        role: m.role === 'model' ? ('assistant' as const) : ('user' as const),
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ];

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content ?? '';
  }
}
