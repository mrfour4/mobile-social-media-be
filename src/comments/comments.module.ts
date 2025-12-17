// src/comments/comments.module.ts
import { Module } from '@nestjs/common';
import { AiModule } from 'src/ai/ai.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [NotificationsModule, AiModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
