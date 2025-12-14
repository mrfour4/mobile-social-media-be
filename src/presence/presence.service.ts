import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class PresenceService {
  private onlineConnections = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  private async getFriendIds(userId: string): Promise<string[]> {
    const friends = await this.prisma.friend.findMany({
      where: {
        OR: [{ userId1: userId }, { userId2: userId }],
      },
    });

    return friends.map((f) => (f.userId1 === userId ? f.userId2 : f.userId1));
  }

  async userConnected(userId: string, server: Server) {
    const current = this.onlineConnections.get(userId) ?? 0;
    const next = current + 1;
    this.onlineConnections.set(userId, next);

    if (current === 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { isOnline: true },
      });

      const friendIds = await this.getFriendIds(userId);

      const payload = {
        userId,
        isOnline: true,
        lastSeenAt: null,
      };

      friendIds.forEach((friendId) => {
        server.to(`user:${friendId}`).emit('presence', payload);
      });
    }
  }

  async userDisconnected(userId: string, server: Server) {
    const current = this.onlineConnections.get(userId) ?? 0;
    const next = current - 1;

    if (next <= 0) {
      this.onlineConnections.delete(userId);

      const lastSeenAt = new Date();

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isOnline: false,
          lastSeenAt,
        },
      });

      const friendIds = await this.getFriendIds(userId);

      const payload = {
        userId,
        isOnline: false,
        lastSeenAt,
      };

      friendIds.forEach((friendId) => {
        server.to(`user:${friendId}`).emit('presence', payload);
      });
    } else {
      this.onlineConnections.set(userId, next);
    }
  }

  async getPresenceForViewer(targetUserId: string, viewerId: string) {
    if (targetUserId === viewerId) {
      return this.prisma.user.findUnique({
        where: { id: targetUserId },
        select: { isOnline: true, lastSeenAt: true },
      });
    }

    const isFriend = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { userId1: viewerId, userId2: targetUserId },
          { userId1: targetUserId, userId2: viewerId },
        ],
      },
    });

    if (!isFriend) {
      return null;
    }

    return this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { isOnline: true, lastSeenAt: true },
    });
  }
}
