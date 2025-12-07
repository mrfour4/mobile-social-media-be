// src/reactions/reactions.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ReactionTargetType } from '../generated/prisma/enums';
import { CreateReactionDto } from './dtos/create-reaction.dto';

@Injectable()
export class ReactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async validateTarget(targetType: ReactionTargetType, targetId: string) {
    if (targetType === ReactionTargetType.POST) {
      const post = await this.prisma.post.findFirst({
        where: { id: targetId, deletedAt: null },
      });
      if (!post) throw new NotFoundException('Post not found');
      return;
    }

    if (targetType === ReactionTargetType.COMMENT) {
      const comment = await this.prisma.comment.findFirst({
        where: { id: targetId, deletedAt: null },
      });
      if (!comment) throw new NotFoundException('Comment not found');
      return;
    }

    throw new BadRequestException('Invalid targetType');
  }

  async addReaction(userId: string, dto: CreateReactionDto) {
    await this.validateTarget(dto.targetType, dto.targetId);

    const existing = await this.prisma.reaction.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: dto.targetType,
          targetId: dto.targetId,
        },
      },
    });

    if (existing) {
      const updated = await this.prisma.reaction.update({
        where: { id: existing.id },
        data: { type: dto.type },
      });
      return updated;
    }

    return this.prisma.reaction.create({
      data: {
        userId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        type: dto.type,
      },
    });
  }

  async removeReaction(
    userId: string,
    targetType: ReactionTargetType,
    targetId: string,
  ) {
    const reaction = await this.prisma.reaction.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType,
          targetId,
        },
      },
    });

    if (!reaction) throw new NotFoundException('Reaction not found');
    if (reaction.userId !== userId) throw new ForbiddenException();

    await this.prisma.reaction.delete({
      where: { id: reaction.id },
    });

    return { success: true };
  }
}
