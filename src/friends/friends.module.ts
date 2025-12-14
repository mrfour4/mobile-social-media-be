// src/friends/friends.module.ts
import { Module } from '@nestjs/common';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';

@Module({
  imports: [NotificationsModule],
  providers: [FriendsService],
  controllers: [FriendsController],
  exports: [FriendsService],
})
export class FriendsModule {}
