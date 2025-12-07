// src/ai/ai.service.ts
import { Injectable } from '@nestjs/common';

export type ModerationResult = {
  status: 'OK' | 'FLAGGED' | 'REJECTED';
  reasons: string[];
};

@Injectable()
export class AiService {
  async moderateText(_text: string): Promise<ModerationResult> {
    return {
      status: 'OK',
      reasons: [],
    };
  }
}
