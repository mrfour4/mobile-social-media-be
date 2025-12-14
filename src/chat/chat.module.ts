// src/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { ChatGateway } from './chat.gateway';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { PresenceController } from './presence.controller';
import { PresenceService } from './presence.service';

@Module({
  imports: [AuthModule],
  providers: [
    ConversationsService,
    MessagesService,
    ChatGateway,
    PresenceService,
  ],
  controllers: [
    ConversationsController,
    MessagesController,
    PresenceController,
  ],
  exports: [ConversationsService, MessagesService],
})
export class ChatModule {}
