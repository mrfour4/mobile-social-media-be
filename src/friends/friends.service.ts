import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { PrismaService } from '../database/prisma.service';
import { FriendRequestStatus } from '../generated/prisma/enums';
import { CreateFriendRequestDto } from './dtos/create-friend-request.dto';

@Injectable()
export class FriendsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private sortUserPair(
    userId: string,
    otherId: string,
  ): { userId1: string; userId2: string } {
    if (userId < otherId) {
      return { userId1: userId, userId2: otherId };
    }
    return { userId1: otherId, userId2: userId };
  }

  async areFriends(userId: string, otherId: string) {
    const { userId1, userId2 } = this.sortUserPair(userId, otherId);
    const friend = await this.prisma.friend.findUnique({
      where: { userId1_userId2: { userId1, userId2 } },
    });
    return !!friend;
  }

  async isBlocked(userId: string, otherId: string) {
    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: otherId },
          { blockerId: otherId, blockedId: userId },
        ],
      },
    });
    return !!block;
  }

  async sendFriendRequest(currentUserId: string, dto: CreateFriendRequestDto) {
    if (currentUserId === dto.toUserId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    if (await this.isBlocked(currentUserId, dto.toUserId)) {
      throw new ForbiddenException('You cannot send request to this user');
    }

    if (await this.areFriends(currentUserId, dto.toUserId)) {
      throw new BadRequestException('Already friends');
    }

    const existing = await this.prisma.friendRequest.findFirst({
      where: {
        fromUserId: currentUserId,
        toUserId: dto.toUserId,
        status: FriendRequestStatus.PENDING,
      },
    });

    if (existing) {
      throw new BadRequestException('Friend request already sent');
    }

    const request = await this.prisma.friendRequest.create({
      data: {
        fromUserId: currentUserId,
        toUserId: dto.toUserId,
      },
    });

    await this.notificationsService.notifyFriendRequestReceived(
      dto.toUserId,
      currentUserId,
      request.id,
    );

    return request;
  }

  async getReceivedRequests(userId: string) {
    const requests = await this.prisma.friendRequest.findMany({
      where: {
        toUserId: userId,
        status: FriendRequestStatus.PENDING,
      },
      include: {
        fromUser: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests;
  }

  async getSentRequests(userId: string) {
    const requests = await this.prisma.friendRequest.findMany({
      where: {
        fromUserId: userId,
        status: FriendRequestStatus.PENDING,
      },
      include: {
        toUser: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests;
  }

  async respondToRequest(userId: string, requestId: string, accept: boolean) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new NotFoundException('Request not found');
    if (request.toUserId !== userId) throw new ForbiddenException();
    if (request.status !== FriendRequestStatus.PENDING) {
      throw new BadRequestException('Request is not pending');
    }

    if (!accept) {
      await this.prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: FriendRequestStatus.REJECTED },
      });
      return { success: true };
    }

    const { userId1, userId2 } = this.sortUserPair(
      request.fromUserId,
      request.toUserId,
    );

    await this.prisma.$transaction([
      this.prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: FriendRequestStatus.ACCEPTED },
      }),
      this.prisma.friend.upsert({
        where: { userId1_userId2: { userId1, userId2 } },
        update: {},
        create: { userId1, userId2 },
      }),
    ]);

    await this.notificationsService.notifyFriendRequestAccepted(
      request.fromUserId,
      request.toUserId,
      request.id,
    );

    return { success: true };
  }

  async listFriends(userId: string) {
    const friends = await this.prisma.friend.findMany({
      where: {
        OR: [{ userId1: userId }, { userId2: userId }],
      },
      include: {
        user1: true,
        user2: true,
      },
    });

    return friends.map((f) => {
      const other = f.userId1 === userId ? f.user2 : f.user1;
      return {
        friendId: other.id,
        name: other.name,
        avatarUrl: other.avatarUrl,
      };
    });
  }

  async blockUser(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new BadRequestException('Cannot block yourself');
    }

    await this.prisma.block.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: userId,
          blockedId: targetUserId,
        },
      },
      update: {},
      create: {
        blockerId: userId,
        blockedId: targetUserId,
      },
    });

    const { userId1, userId2 } = this.sortUserPair(userId, targetUserId);

    await this.prisma.friend.deleteMany({
      where: { userId1, userId2 },
    });

    await this.prisma.friendRequest.updateMany({
      where: {
        OR: [
          { fromUserId: userId, toUserId: targetUserId },
          { fromUserId: targetUserId, toUserId: userId },
        ],
        status: FriendRequestStatus.PENDING,
      },
      data: { status: FriendRequestStatus.CANCELED },
    });

    return { success: true };
  }

  async unblockUser(userId: string, targetUserId: string) {
    await this.prisma.block.deleteMany({
      where: {
        blockerId: userId,
        blockedId: targetUserId,
      },
    });
    return { success: true };
  }

  async createInviteCode(userId: string) {
    const now = new Date();

    const existing = await this.prisma.friendInviteCode.findFirst({
      where: {
        ownerId: userId,
        usedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return existing;
    }

    const code = randomBytes(8).toString('hex');
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);

    const invite = await this.prisma.friendInviteCode.create({
      data: {
        code,
        ownerId: userId,
        expiresAt,
      },
    });

    return invite;
  }

  async getLatestInviteCode(userId: string) {
    const now = new Date();

    const code = await this.prisma.friendInviteCode.findFirst({
      where: {
        ownerId: userId,
        usedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: 'desc' },
    });

    return code;
  }

  async acceptInviteCode(userId: string, code: string) {
    const invite = await this.prisma.friendInviteCode.findUnique({
      where: { code },
    });
    if (!invite) throw new NotFoundException('Code not found');
    if (invite.usedAt) throw new BadRequestException('Code already used');
    if (invite.ownerId === userId) {
      throw new BadRequestException('Cannot use your own code');
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new BadRequestException('Code expired');
    }

    if (await this.isBlocked(userId, invite.ownerId)) {
      throw new ForbiddenException('Blocked');
    }

    if (await this.areFriends(userId, invite.ownerId)) {
      throw new BadRequestException('Already friends');
    }

    const { userId1, userId2 } = this.sortUserPair(userId, invite.ownerId);

    await this.prisma.$transaction([
      this.prisma.friendInviteCode.update({
        where: { id: invite.id },
        data: {
          usedByUserId: userId,
          usedAt: new Date(),
        },
      }),
      this.prisma.friend.upsert({
        where: { userId1_userId2: { userId1, userId2 } },
        update: {},
        create: { userId1, userId2 },
      }),
    ]);

    return { success: true };
  }
}
