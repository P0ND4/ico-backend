import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { IAiTutor, ChatMessage } from '../../domain/ports/ai-tutor.port';
import { AI_MARKDOWN_FORMATTING_BRIEF } from 'src/contexts/shared/constants/ai-markdown-formatting';

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

  async generateTitle(firstMessage: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'Generate a short conversation title (max 6 words) based on the user\'s first message. Reply with ONLY the title, no quotes, no punctuation at the end. Match the language of the message.',
        },
        { role: 'user', content: firstMessage },
      ],
      temperature: 0.5,
      max_tokens: 20,
    });
    return response.choices[0]?.message?.content?.trim() ?? firstMessage.slice(0, 40);
  }

  async chat(history: ChatMessage[], userMessage: string): Promise<string> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content:
          `You are I.C.O's AI tutor. Help users understand concepts clearly and concisely. Respond in the same language the user writes in.\n\n${AI_MARKDOWN_FORMATTING_BRIEF}`,
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
