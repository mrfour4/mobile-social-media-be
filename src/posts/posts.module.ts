// src/posts/posts.module.ts
import { Module } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  controllers: [PostsController],
  providers: [PostsService, AiService],
  exports: [PostsService],
})
export class PostsModule {}
