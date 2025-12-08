// src/chat/conversations.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dtos/create-conversation.dto';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateConversationDto) {
    return this.conversationsService.createConversation(user.sub, dto);
  }

  @Get()
  list(@CurrentUser() user: any) {
    return this.conversationsService.listConversations(user.sub);
  }

  @Get(':id')
  getOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.conversationsService.getConversation(user.sub, id);
  }

  @Post(':id/members')
  addMember(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('userId') memberId: string,
  ) {
    return this.conversationsService.addMember(user.sub, id, memberId);
  }

  @Patch(':id/members/:userId/remove')
  removeMember(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('userId') memberId: string,
  ) {
    return this.conversationsService.removeMember(user.sub, id, memberId);
  }
}
