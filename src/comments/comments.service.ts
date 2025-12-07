// src/comments/comments.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../database/prisma.service';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { UpdateCommentDto } from './dtos/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
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
      if (!parent || parent.deletedAt)
        throw new BadRequestException('Parent comment does not exist');
      if (parent.parentCommentId)
        throw new BadRequestException('Only 1-level reply allowed');
    }

    const moderation = await this.aiService.moderateText(dto.content);

    const comment = await this.prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        content: dto.content,
        parentCommentId: dto.parentCommentId ?? null,
        aiStatus: moderation.status,
        aiReason: moderation.reasons.join(','),
      },
      include: {
        author: true,
        replies: true,
      },
    });

    return comment;
  }

  async getComments(postId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const comments = await this.prisma.comment.findMany({
      where: {
        postId,
        parentCommentId: null,
        deletedAt: null,
      },
      include: {
        author: true,
        replies: {
          include: { author: true },
          where: { deletedAt: null },
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

    const moderation = await this.aiService.moderateText(dto.content);

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        content: dto.content,
        aiStatus: moderation.status,
        aiReason: moderation.reasons.join(','),
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
