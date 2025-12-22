import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../database/prisma.service';
import { AiStatus, MediaType, Privacy } from '../generated/prisma/enums';
import { CreatePostDto } from './dtos/create-post.dto';
import { UpdatePostDto } from './dtos/update-post.dto';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async createPost(userId: string, dto: CreatePostDto) {
    if (dto.media) {
      const images = dto.media.filter((m) => m.type === MediaType.IMAGE);
      const videos = dto.media.filter((m) => m.type === MediaType.VIDEO);

      if (images.length > 5)
        throw new BadRequestException('Max 5 images allowed');
      if (videos.length > 1)
        throw new BadRequestException('Max 1 video allowed');
    }

    const moderation = await this.aiService.moderateText(dto.text ?? '', {
      type: 'post',
      userId,
    });

    if (!moderation.allowed) {
      throw new BadRequestException(
        `Nội dung không phù hợp: ${moderation.reason ?? 'vi phạm guideline.'}`,
      );
    }

    const post = await this.prisma.post.create({
      data: {
        authorId: userId,
        text: dto.text ?? null,
        privacy: dto.privacy,
        aiStatus: AiStatus.OK,
        aiReason: moderation.reason,
        media: dto.media
          ? {
              create: dto.media.map((m, index) => ({
                type: m.type,
                url: m.url,
                size: m.size,
                order: index,
              })),
            }
          : undefined,
      },
      include: {
        media: true,
        author: true,
      },
    });

    return post;
  }

  async getPost(postId: string) {
    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        deletedAt: null,
        hiddenAt: null,
      },
      include: {
        comments: {
          include: {
            author: true,
          },
        },
        reactions: {
          include: {
            user: true,
          },
        },
        media: true,
        author: true,
        sharedFrom: {
          include: { author: true, media: true },
        },
      },
    });

    if (!post) throw new NotFoundException('Post not found');

    return post;
  }

  async getFeed(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const friends = await this.prisma.friend.findMany({
      where: {
        OR: [{ userId1: userId }, { userId2: userId }],
      },
    });

    const friendIds = friends.map((f) =>
      f.userId1 === userId ? f.userId2 : f.userId1,
    );

    const posts = await this.prisma.post.findMany({
      where: {
        deletedAt: null,
        hiddenAt: null,
        OR: [
          {
            authorId: userId,
          },
          {
            authorId: { in: friendIds },
            privacy: { in: [Privacy.PUBLIC, Privacy.FRIENDS] },
          },
        ],
      },
      include: {
        media: true,
        author: true,
        sharedFrom: {
          include: { author: true, media: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return posts;
  }

  async updatePost(postId: string, userId: string, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.deletedAt) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new ForbiddenException();

    const moderation = await this.aiService.moderateText(dto.text ?? '', {
      type: 'post',
      userId,
    });

    if (!moderation.allowed) {
      throw new BadRequestException(
        `Nội dung không phù hợp: ${moderation.reason ?? 'vi phạm guideline.'}`,
      );
    }

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: dto,
      include: { media: true },
    });

    return updated;
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException();
    if (post.authorId !== userId) throw new ForbiddenException();

    await this.prisma.post.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  async sharePost(userId: string, postId: string, text?: string) {
    const shared = await this.prisma.post.create({
      data: {
        authorId: userId,
        text: text ?? null,
        sharedFromId: postId,
      },
      include: {
        author: true,
        sharedFrom: {
          include: { author: true, media: true },
        },
      },
    });

    return shared;
  }
}
