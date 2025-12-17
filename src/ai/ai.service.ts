import { Injectable, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';

export type ModerationSeverity = 'low' | 'medium' | 'high';

export type ModerationCategory =
  | 'sexual'
  | 'hate'
  | 'violence'
  | 'self_harm'
  | 'harassment'
  | 'drugs'
  | 'spam'
  | 'other';

export interface ModerationResult {
  allowed: boolean;
  category?: ModerationCategory;
  severity?: ModerationSeverity;
  reason?: string;
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: Groq | null;

  private readonly chatModel =
    process.env.GROQ_MODEL_CHAT ?? 'llama-3.3-70b-versatile';

  private readonly moderationModel =
    process.env.GROQ_MODEL_MODERATION ?? 'openai/gpt-oss-safeguard-20b';

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      this.logger.warn(
        'GROQ_API_KEY is not set. AI features (moderation, chatbot) are disabled.',
      );
      this.client = null;
    } else {
      this.client = new Groq({ apiKey });
    }
  }

  private get enabled(): boolean {
    return !!this.client;
  }

  private safeJsonParse<T>(text: string): T | null {
    try {
      return JSON.parse(text) as T;
    } catch (err) {
      this.logger.warn(`Failed to parse AI JSON: ${(err as Error).message}`);
      return null;
    }
  }

  async moderateText(
    text: string,
    context?: { type?: 'post' | 'comment' | 'message'; userId?: string },
  ): Promise<ModerationResult> {
    if (!this.enabled) {
      return { allowed: true, reason: 'AI disabled (no GROQ_API_KEY).' };
    }

    if (!text || !text.trim()) {
      return { allowed: true, reason: 'Empty text.' };
    }

    const BANNED_KEYWORDS = ['ba que', 'xỏ lá'];
    const normalizedText = text.toLowerCase();

    for (const keyword of BANNED_KEYWORDS) {
      if (normalizedText.includes(keyword)) {
        return {
          allowed: false,
          category: 'hate',
          severity: 'medium',
          reason: 'The content violates community standards.',
        };
      }
    }

    const typeLabel = context?.type ?? 'content';

    const systemPrompt = `
You are a strict content moderation engine for a social mobile app.
You must analyze the user ${typeLabel} and decide if it is allowed according to community guidelines.

Return ONLY a valid JSON object with this shape (no extra text):

{
  "allowed": boolean,
  "category": "sexual" | "hate" | "violence" | "self_harm" | "harassment" | "drugs" | "spam" | "other",
  "severity": "low" | "medium" | "high",
  "reason": string
}

Rules:
- "allowed" = false if the content contains explicit / severe disallowed content.
- "severity" reflects how serious the violation is.
- If content is safe, use category = "other" and severity = "low".
`;

    const userPrompt = `User ${typeLabel}:\n"""${text}"""`;

    try {
      const completion = await this.client!.chat.completions.create({
        model: this.moderationModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_completion_tokens: 256,
      });

      const content =
        completion.choices[0]?.message?.content?.trim() ?? '{"allowed":true}';

      const parsed = this.safeJsonParse<ModerationResult>(content);

      if (!parsed) {
        this.logger.warn(`AI moderation returned non-JSON: ${content}`);
        return {
          allowed: true,
          reason: 'AI moderation failed to parse. Fallback allow.',
        };
      }

      if (parsed.allowed === undefined) {
        parsed.allowed = true;
      }

      return parsed;
    } catch (error) {
      this.logger.error(
        `Error calling Groq moderation: ${(error as Error).message}`,
      );

      return {
        allowed: true,
        reason: 'AI moderation error. Fallback allow.',
      };
    }
  }

  async generateChatbotReply(
    userId: string,
    message: string,
    history: ChatHistoryItem[] = [],
  ): Promise<string> {
    if (!this.enabled) {
      return 'AI is currently not configured by the server.';
    }

    const systemPrompt = `
You are a friendly chatbot inside a mobile social app.
The app is used mainly by Vietnamese young people.
Constraints:
- Be concise and clear.
- Default language: Vietnamese (trừ khi user dùng tiếng Anh rõ ràng).
- Không nói về chính sách nội bộ, API, model.
- Nếu user hỏi về trend mạng xã hội, hãy trả lời ngắn, dễ hiểu.

User id: ${userId}
`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.map((h) => ({
        role: h.role,
        content: h.content,
      })),
      { role: 'user' as const, content: message },
    ];

    try {
      const completion = await this.client!.chat.completions.create({
        model: this.chatModel,
        messages,
        temperature: 0.7,
        max_completion_tokens: 512,
        top_p: 0.95,
      });

      const reply = completion.choices[0]?.message?.content ?? '';

      return reply.trim();
    } catch (error) {
      this.logger.error(
        `Error calling Groq chatbot: ${(error as Error).message}`,
      );
      return 'Xin lỗi, hiện tại chatbot đang gặp sự cố. Bạn thử lại sau nhé.';
    }
  }
}
