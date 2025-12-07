// src/comments/comments.module.ts
import { Module } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService, AiService],
})
export class CommentsModule {}
