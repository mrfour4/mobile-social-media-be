import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { MessagesModule } from 'src/messages/messages.module';
import { PresenceModule } from 'src/presence/presence.module';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [AuthModule, MessagesModule, PresenceModule],
  providers: [ChatGateway],
})
export class ChatModule {}
