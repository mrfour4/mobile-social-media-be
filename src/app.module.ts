// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AdminModule } from './admin/admin.module';
import { AiChatModule } from './ai-chat/ai-chat.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { CommentsModule } from './comments/comments.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { RolesGuard } from './common/guards/roles.guard';
import { ConversationsModule } from './conversations/conversations.module';
import { PrismaModule } from './database/prisma.module';
import { FriendsModule } from './friends/friends.module';
import { LocationModule } from './location/location.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PostsModule } from './posts/posts.module';
import { PresenceModule } from './presence/presence.module';
import { ReactionsModule } from './reactions/reactions.module';
import { UploadsModule } from './uploads/uploads.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PostsModule,
    CommentsModule,
    ReactionsModule,
    UploadsModule,
    AiModule,
    LocationModule,
    FriendsModule,
    ChatModule,
    ConversationsModule,
    MessagesModule,
    PresenceModule,
    NotificationsModule,
    AdminModule,
    AiModule,
    AiChatModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    RolesGuard,
  ],
})
export class AppModule {}
