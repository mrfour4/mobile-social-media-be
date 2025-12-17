// src/ai/ai-chat.module.ts
import { Module } from '@nestjs/common';
import { AiModule } from 'src/ai/ai.module';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';

@Module({
  imports: [AiModule],
  controllers: [AiChatController],
  providers: [AiChatService],
})
export class AiChatModule {}
