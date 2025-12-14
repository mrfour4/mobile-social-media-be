// src/notifications/notifications.controller.ts
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ListNotificationsDto } from './dtos/list-notifications.dto';
import { MarkReadDto } from './dtos/mark-read.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: any, @Query() query: ListNotificationsDto) {
    return this.notificationsService.list(user.sub, query);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: any) {
    return this.notificationsService.unreadCount(user.sub);
  }

  @Post('mark-read')
  markRead(@CurrentUser() user: any, @Body() body: MarkReadDto) {
    const ids = body.ids ?? (body.id ? [body.id] : []);

    return this.notificationsService.markRead(user.sub, ids);
  }

  @Post('mark-all-read')
  markAllRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllRead(user.sub);
  }
}
