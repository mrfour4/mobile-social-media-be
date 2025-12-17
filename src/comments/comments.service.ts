import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AiStatus } from 'src/generated/prisma/enums';
import { NotificationsService } from 'src/notifications/notifications.service';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../database/prisma.service';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { UpdateCommentDto } from './dtos/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createComment(userId: string, postId: string, dto: CreateCommentDto) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
    });
    if (!post) throw new NotFoundException('Post not found');

    if (dto.parentCommentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentCommentId },
      });
      if (!parent || parent.deletedAt || parent.hiddenAt) {
        throw new BadRequestException('Parent comment does not exist');
      }

      if (parent.parentCommentId) {
        throw new BadRequestException('Only 1-level reply allowed');
      }
    }

    const moderation = await this.aiService.moderateText(dto.content ?? '', {
      type: 'comment',
    });

    if (!moderation.allowed) {
      throw new BadRequestException(
        `Nội dung không phù hợp: ${moderation.reason ?? 'vi phạm guideline.'}`,
      );
    }

    const comment = await this.prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        content: dto.content,
        parentCommentId: dto.parentCommentId ?? null,
        aiStatus: AiStatus.OK,
        aiReason: moderation.reason,
      },
      include: {
        author: true,
        replies: true,
      },
    });

    if (post) {
      if (!dto.parentCommentId) {
        await this.notificationsService.notifyPostCommented(
          post.authorId,
          userId,
          postId,
          comment.id,
        );
      } else {
        const parent = await this.prisma.comment.findUnique({
          where: { id: dto.parentCommentId },
          select: { authorId: true },
        });
        if (parent) {
          await this.notificationsService.notifyCommentReplied(
            parent.authorId,
            userId,
            postId,
            comment.id,
          );
        }
      }
    }

    return comment;
  }

  async getComments(postId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const comments = await this.prisma.comment.findMany({
      where: {
        postId,
        parentCommentId: null,
        deletedAt: null,
        hiddenAt: null,
      },
      include: {
        author: true,
        replies: {
          include: { author: true },
          where: { deletedAt: null, hiddenAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    });

    return comments;
  }

  async updateComment(
    commentId: string,
    userId: string,
    dto: UpdateCommentDto,
  ) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment || comment.deletedAt)
      throw new NotFoundException('Comment not found');

    if (comment.authorId !== userId) throw new ForbiddenException();

    const moderation = await this.aiService.moderateText(dto.content, {
      type: 'comment',
    });

    if (!moderation.allowed) {
      throw new BadRequestException(
        `Nội dung không phù hợp: ${moderation.reason ?? 'vi phạm guideline.'}`,
      );
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        content: dto.content,
      },
      include: { author: true },
    });

    return updated;
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException();
    if (comment.authorId !== userId) throw new ForbiddenException();

    await this.prisma.comment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }
}
