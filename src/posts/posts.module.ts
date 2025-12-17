// src/posts/posts.module.ts
import { Module } from '@nestjs/common';
import { AiModule } from 'src/ai/ai.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [AiModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
