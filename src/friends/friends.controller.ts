// src/friends/friends.controller.ts
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
import { BlockUserDto } from './dtos/block-user.dto';
import { CreateFriendRequestDto } from './dtos/create-friend-request.dto';
import { FriendsService } from './friends.service';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('requests')
  sendRequest(@CurrentUser() user: any, @Body() dto: CreateFriendRequestDto) {
    return this.friendsService.sendFriendRequest(user.sub, dto);
  }

  @Get('requests/received')
  getReceived(@CurrentUser() user: any) {
    return this.friendsService.getReceivedRequests(user.sub);
  }

  @Get('requests/sent')
  getSent(@CurrentUser() user: any) {
    return this.friendsService.getSentRequests(user.sub);
  }

  @Patch('requests/:id/accept')
  accept(@CurrentUser() user: any, @Param('id') id: string) {
    return this.friendsService.respondToRequest(user.sub, id, true);
  }

  @Patch('requests/:id/reject')
  reject(@CurrentUser() user: any, @Param('id') id: string) {
    return this.friendsService.respondToRequest(user.sub, id, false);
  }

  @Get()
  listFriends(@CurrentUser() user: any) {
    return this.friendsService.listFriends(user.sub);
  }

  @Post('block')
  block(@CurrentUser() user: any, @Body() dto: BlockUserDto) {
    return this.friendsService.blockUser(user.sub, dto.targetUserId);
  }

  @Post('unblock')
  unblock(@CurrentUser() user: any, @Body() dto: BlockUserDto) {
    return this.friendsService.unblockUser(user.sub, dto.targetUserId);
  }

  @Post('invite-code')
  createInvite(@CurrentUser() user: any) {
    return this.friendsService.createInviteCode(user.sub);
  }

  @Get('invite-code')
  getInvite(@CurrentUser() user: any) {
    return this.friendsService.getLatestInviteCode(user.sub);
  }

  @Post('accept-invite')
  acceptInvite(@CurrentUser() user: any, @Body('code') code: string) {
    return this.friendsService.acceptInviteCode(user.sub, code);
  }
}
