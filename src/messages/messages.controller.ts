import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { MessagesCursorQueryDto } from './dtos/messages-cursor-query.dto';
import { SendMessageDto } from './dtos/send-message.dto';
import { MessagesService } from './messages.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations/:id/messages')
  getMessages(
    @CurrentUser() user: any,
    @Param('id') conversationId: string,
    @Query() query: MessagesCursorQueryDto,
  ) {
    return this.messagesService.getMessages(user.sub, conversationId, query);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @CurrentUser() user: any,
    @Param('id') conversationId: string,
    @Body() body: Omit<SendMessageDto, 'conversationId'>,
  ) {
    const dto: SendMessageDto = {
      ...body,
      conversationId,
    };
    return this.messagesService.sendMessage(user.sub, dto);
  }

  @Post('messages/:id/read')
  markRead(@CurrentUser() user: any, @Param('id') messageId: string) {
    return this.messagesService.markMessageRead(user.sub, messageId);
  }
}
