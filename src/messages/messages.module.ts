import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { ConversationsModule } from 'src/conversations/conversations.module';
import { PrismaModule } from 'src/database/prisma.module';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [AuthModule, PrismaModule, ConversationsModule],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
