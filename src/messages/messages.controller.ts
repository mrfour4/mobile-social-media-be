import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { MessagesCursorQueryDto } from './dtos/messages-cursor-query.dto';
import { ReactMessageDto } from './dtos/react-message.dto';
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

  @Delete('messages/:id')
  softDelete(@CurrentUser() user: any, @Param('id') messageId: string) {
    return this.messagesService.softDeleteMessage(user.sub, messageId);
  }

  @Post('messages/:id/reactions')
  reactMessage(
    @CurrentUser() user: any,
    @Param('id') messageId: string,
    @Body() body: Omit<ReactMessageDto, 'messageId'>,
  ) {
    const dto: ReactMessageDto = {
      ...body,
      messageId,
    };

    return this.messagesService.reactToMessage(
      user.sub,
      dto.messageId,
      dto.type,
    );
  }

  @Delete('messages/:id/reactions')
  unreactMessage(@CurrentUser() user: any, @Param('id') messageId: string) {
    return this.messagesService.unreactMessage(user.sub, messageId);
  }
}
