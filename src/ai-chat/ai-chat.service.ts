import { ForbiddenException, Injectable } from '@nestjs/common';
import { AiService, ChatHistoryItem } from 'src/ai/ai.service';

interface Usage {
  date: string;
  count: number;
}

@Injectable()
export class AiChatService {
  private readonly dailyLimit = 50;
  private readonly usageMap = new Map<string, Usage>();

  constructor(private readonly aiService: AiService) {}

  private checkAndIncreaseUsage(userId: string): void {
    const today = new Date().toISOString().slice(0, 10);
    const current = this.usageMap.get(userId);

    if (!current || current.date !== today) {
      this.usageMap.set(userId, { date: today, count: 1 });
      return;
    }

    if (current.count >= this.dailyLimit) {
      throw new ForbiddenException(
        `Bạn đã dùng hết ${this.dailyLimit} lượt chat với AI hôm nay.`,
      );
    }

    current.count += 1;
    this.usageMap.set(userId, current);
  }

  async chat(
    userId: string,
    message: string,
    historyDto: { role: 'user' | 'assistant'; content: string }[] = [],
  ) {
    this.checkAndIncreaseUsage(userId);

    const history: ChatHistoryItem[] = historyDto.map((h) => ({
      role: h.role,
      content: h.content,
    }));

    const reply = await this.aiService.generateChatbotReply(
      userId,
      message,
      history,
    );

    return {
      reply,
    };
  }
}
