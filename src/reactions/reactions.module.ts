// src/reactions/reactions.module.ts
import { Module } from '@nestjs/common';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { ReactionsController } from './reactions.controller';
import { ReactionsService } from './reactions.service';

@Module({
  imports: [NotificationsModule],
  providers: [ReactionsService],
  controllers: [ReactionsController],
})
export class ReactionsModule {}
