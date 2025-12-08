// src/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { ChatGateway } from './chat.gateway';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [AuthModule],
  providers: [ConversationsService, MessagesService, ChatGateway],
  controllers: [ConversationsController, MessagesController],
  exports: [ConversationsService, MessagesService],
})
export class ChatModule {}
