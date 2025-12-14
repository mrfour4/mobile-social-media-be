// src/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { NotificationType, ReactionType } from 'src/generated/prisma/enums';
import { PrismaService } from '../database/prisma.service';
import { ListNotificationsDto } from './dtos/list-notifications.dto';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async list(userId: string, query: ListNotificationsDto) {
    const { cursor, limit } = query;

    const args: any = {
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    };

    if (cursor) {
      args.cursor = { id: cursor };
      args.skip = 1;
    }

    const items = await this.prisma.notification.findMany(args);

    let nextCursor: string | null = null;
    if (items.length === limit) {
      nextCursor = items[items.length - 1].id;
    }

    return { items, nextCursor };
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { count };
  }

  async markRead(userId: string, ids: string[]) {
    if (ids.length === 0) return { success: true };

    await this.prisma.notification.updateMany({
      where: {
        userId,
        id: { in: ids },
      },
      data: { isRead: true },
    });

    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { success: true };
  }

  async createNotification(
    userId: string,
    type: NotificationType,
    payload: any,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        payload,
      },
    });

    this.gateway.notifyUser(userId, notification);
    return notification;
  }

  async notifyPostLiked(
    postAuthorId: string,
    fromUserId: string,
    postId: string,
  ) {
    if (postAuthorId === fromUserId) return;
    return this.createNotification(postAuthorId, NotificationType.POST_LIKED, {
      postId,
      fromUserId,
    });
  }

  async notifyCommentReacted(
    commentAuthorId: string,
    fromUserId: string,
    postId: string,
    commentId: string,
    reactionType: ReactionType,
  ) {
    if (commentAuthorId === fromUserId) return;

    return this.createNotification(
      commentAuthorId,
      NotificationType.COMMENT_REACTED,
      { postId, commentId, fromUserId, reactionType },
    );
  }

  async notifyPostCommented(
    postAuthorId: string,
    fromUserId: string,
    postId: string,
    commentId: string,
  ) {
    if (postAuthorId === fromUserId) return;
    return this.createNotification(
      postAuthorId,
      NotificationType.POST_COMMENTED,
      { postId, fromUserId, commentId },
    );
  }

  async notifyCommentReplied(
    commentAuthorId: string,
    fromUserId: string,
    postId: string,
    commentId: string,
  ) {
    if (commentAuthorId === fromUserId) return;
    return this.createNotification(
      commentAuthorId,
      NotificationType.COMMENT_REPLIED,
      { postId, fromUserId, commentId },
    );
  }

  async notifyFriendRequestReceived(
    toUserId: string,
    fromUserId: string,
    friendRequestId: string,
  ) {
    return this.createNotification(
      toUserId,
      NotificationType.FRIEND_REQUEST_RECEIVED,
      { fromUserId, friendRequestId },
    );
  }

  async notifyFriendRequestAccepted(
    fromUserId: string,
    toUserId: string,
    friendRequestId: string,
  ) {
    return this.createNotification(
      fromUserId,
      NotificationType.FRIEND_REQUEST_ACCEPTED,
      { toUserId, friendRequestId },
    );
  }

  async notifyNewMessage(
    recipientId: string,
    conversationId: string,
    messageId: string,
    fromUserId: string,
  ) {
    if (recipientId === fromUserId) return;
    return this.createNotification(recipientId, NotificationType.NEW_MESSAGE, {
      conversationId,
      messageId,
      fromUserId,
    });
  }

  async notifyAdminAnnouncement(userId: string, data: any) {
    return this.createNotification(
      userId,
      NotificationType.ADMIN_ANNOUNCEMENT,
      data,
    );
  }
}
