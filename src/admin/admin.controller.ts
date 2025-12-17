import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminService } from './admin.service';
import { AdminAnnouncementDto } from './dtos/admin-announcement.dto';
import { ListCommentsDto } from './dtos/list-comments.dto';
import { ListPostsDto } from './dtos/list-posts.dto';
import { ListUsersDto } from './dtos/list-users.dto';
import { ResetUserPasswordDto } from './dtos/reset-user-password.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  listUsers(@Query() query: ListUsersDto) {
    return this.adminService.listUsers(query);
  }

  @Patch('users/:id/ban')
  banUser(@CurrentUser() admin: any, @Param('id') userId: string) {
    return this.adminService.banUser(admin.sub, userId);
  }

  @Patch('users/:id/unban')
  unbanUser(@CurrentUser() admin: any, @Param('id') userId: string) {
    return this.adminService.unbanUser(admin.sub, userId);
  }

  @Post('users/:id/reset-password')
  resetPassword(
    @CurrentUser() admin: any,
    @Param('id') userId: string,
    @Body() dto: ResetUserPasswordDto,
  ) {
    return this.adminService.resetUserPassword(admin.sub, userId, dto);
  }

  @Get('posts')
  listPosts(@Query() query: ListPostsDto) {
    return this.adminService.listPosts(query);
  }

  @Patch('posts/:id/hide')
  hidePost(@CurrentUser() admin: any, @Param('id') postId: string) {
    return this.adminService.hidePost(admin.sub, postId);
  }

  @Patch('posts/:id/unhide')
  unhidePost(@CurrentUser() admin: any, @Param('id') postId: string) {
    return this.adminService.unhidePost(admin.sub, postId);
  }

  @Delete('posts/:id')
  deletePostHard(@CurrentUser() admin: any, @Param('id') postId: string) {
    return this.adminService.deletePostHard(admin.sub, postId);
  }

  @Get('comments')
  listComments(@Query() query: ListCommentsDto) {
    return this.adminService.listComments(query);
  }

  @Patch('comments/:id/hide')
  hideComment(@CurrentUser() admin: any, @Param('id') commentId: string) {
    return this.adminService.hideComment(admin.sub, commentId);
  }

  @Delete('comments/:id')
  deleteCommentHard(@CurrentUser() admin: any, @Param('id') commentId: string) {
    return this.adminService.deleteCommentHard(admin.sub, commentId);
  }

  @Post('announcements')
  createAnnouncement(
    @CurrentUser() admin: any,
    @Body() dto: AdminAnnouncementDto,
  ) {
    return this.adminService.createAnnouncement(admin.sub, dto);
  }

  @Get('password-reset-requests')
  listPasswordResetRequests() {
    return this.adminService.listPasswordResetRequests();
  }

  @Post('password-reset-requests/:token/approve')
  approvePasswordResetRequest(
    @CurrentUser() admin: any,
    @Param('token') token: string,
  ) {
    return this.adminService.approvePasswordResetRequest(admin.sub, token);
  }

  @Patch('comments/:id/unhide')
  unhideComment(@CurrentUser() admin: any, @Param('id') commentId: string) {
    return this.adminService.unhideComment(admin.sub, commentId);
  }

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }
}
