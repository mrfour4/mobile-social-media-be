import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { EmailService } from 'src/email/email.service';
import { PasswordResetPurpose } from 'src/generated/prisma/enums';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AdminAnnouncementDto } from './dtos/admin-announcement.dto';
import { ListCommentsDto } from './dtos/list-comments.dto';
import { ListPostsDto } from './dtos/list-posts.dto';
import { ListUsersDto } from './dtos/list-users.dto';
import { ResetUserPasswordDto } from './dtos/reset-user-password.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  private async logAction(
    adminId: string,
    actionType: string,
    targetType?: string,
    targetId?: string,
    metadata?: any,
  ) {
    await this.prisma.adminActionLog.create({
      data: {
        adminId,
        actionType,
        targetType,
        targetId,
        metadata,
      },
    });
  }

  async listUsers(dto: ListUsersDto) {
    const { page, limit, search, isBanned } = dto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (typeof isBanned === 'string') {
      where.isBanned = isBanned === 'true';
    }
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const safeItems = items.map(({ passwordHash, ...rest }) => rest);

    return {
      items: safeItems,
      total,
      page,
      limit,
    };
  }

  async banUser(adminId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.isBanned) {
      throw new BadRequestException('User already banned');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isBanned: true },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });

    await this.logAction(adminId, 'BAN_USER', 'USER', userId, {
      email: user.email,
    });

    const { passwordHash, ...safe } = updated;
    return safe;
  }

  async unbanUser(adminId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (!user.isBanned) {
      throw new BadRequestException('User is not banned');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isBanned: false },
    });

    await this.logAction(adminId, 'UNBAN_USER', 'USER', userId, {
      email: user.email,
    });

    const { passwordHash, ...safe } = updated;
    return safe;
  }

  async resetUserPassword(
    adminId: string,
    userId: string,
    dto: ResetUserPasswordDto,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.logAction(adminId, 'RESET_PASSWORD', 'USER', userId, {
      email: user.email,
    });

    return { success: true };
  }

  async listPosts(dto: ListPostsDto) {
    const { page, limit, includeDeleted, includeHidden } = dto;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (includeDeleted !== 'true') {
      where.deletedAt = null;
    }

    if (includeHidden !== 'true') {
      where.hiddenAt = null;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: true,
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async hidePost(adminId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    if (post.deletedAt) {
      throw new BadRequestException('Post already deleted');
    }
    if (post.hiddenAt) {
      throw new BadRequestException('Post already hidden');
    }

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: { hiddenAt: new Date() },
    });

    await this.logAction(adminId, 'HIDE_POST', 'POST', postId, null);
    return updated;
  }

  async unhidePost(adminId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    if (post.deletedAt) {
      throw new BadRequestException('Post is deleted');
    }
    if (!post.hiddenAt) {
      throw new BadRequestException('Post is not hidden');
    }

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: { hiddenAt: null },
    });

    await this.logAction(adminId, 'UNHIDE_POST', 'POST', postId, null);
    return updated;
  }

  async deletePostHard(adminId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    await this.prisma.post.delete({ where: { id: postId } });

    await this.logAction(adminId, 'DELETE_POST_HARD', 'POST', postId, null);

    return { success: true };
  }

  async listComments(dto: ListCommentsDto) {
    const { page, limit, includeDeleted } = dto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (includeDeleted !== 'true') {
      where.deletedAt = null;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: true,
          post: true,
        },
      }),
      this.prisma.comment.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async hideComment(adminId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    if (comment.deletedAt) {
      throw new BadRequestException('Comment already deleted');
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });

    await this.logAction(adminId, 'HIDE_COMMENT', 'COMMENT', commentId, null);

    return updated;
  }

  async deleteCommentHard(adminId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    await this.prisma.comment.delete({ where: { id: commentId } });

    await this.logAction(
      adminId,
      'DELETE_COMMENT_HARD',
      'COMMENT',
      commentId,
      null,
    );

    return { success: true };
  }

  async createAnnouncement(adminId: string, dto: AdminAnnouncementDto) {
    const users = await this.prisma.user.findMany({
      where: {
        isBanned: false,
        deletedAt: null,
      },
      select: { id: true },
    });

    for (const u of users) {
      await this.notificationsService.notifyAdminAnnouncement(u.id, {
        title: dto.title,
        content: dto.content,
      });
    }

    await this.logAction(adminId, 'ADMIN_ANNOUNCEMENT', 'SYSTEM', undefined, {
      title: dto.title,
      userCount: users.length,
    });

    return { success: true, userCount: users.length };
  }

  async listPasswordResetRequests() {
    const now = new Date();

    const items = await this.prisma.passwordResetToken.findMany({
      where: {
        purpose: PasswordResetPurpose.ADMIN_ASSISTED,
        usedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, name: true, isBanned: true } },
      },
    });

    return { items };
  }

  async approvePasswordResetRequest(adminId: string, token: string) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record) throw new NotFoundException('Request not found');
    if (record.purpose !== 'ADMIN_ASSISTED')
      throw new BadRequestException('Invalid request type');
    if (record.usedAt) throw new BadRequestException('Request already used');
    if (record.expiresAt < new Date())
      throw new BadRequestException('Request expired');

    if (record.user.isBanned) throw new BadRequestException('User is banned');

    const tempPassword = randomBytes(6).toString('base64url');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId },
        data: { revokedAt: new Date() },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await this.emailService.sendMail(
      record.user.email,
      'Your password has been reset by admin',
      `<p>Admin đã reset mật khẩu cho bạn.</p>
     <p>Mật khẩu tạm thời: <b>${tempPassword}</b></p>
     <p>Vui lòng đăng nhập và đổi mật khẩu ngay.</p>`,
    );

    await this.logAction(
      adminId,
      'ADMIN_RESET_PASSWORD',
      'USER',
      record.userId,
      {
        email: record.user.email,
        requestTokenId: record.id,
      },
    );

    return { success: true };
  }
}
