import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  ConversationMemberRole,
  ConversationType,
} from '../generated/prisma/enums';
import { CreateConversationDto } from './dtos/create-conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createConversation(currentUserId: string, dto: CreateConversationDto) {
    if (dto.type === ConversationType.DIRECT) {
      if (!dto.otherUserId) {
        throw new BadRequestException('otherUserId is required for DIRECT');
      }
      if (dto.otherUserId === currentUserId) {
        throw new BadRequestException(
          'Cannot create direct conversation with yourself',
        );
      }

      const existing = await this.prisma.conversation.findFirst({
        where: {
          type: ConversationType.DIRECT,
          members: {
            some: { userId: currentUserId },
          },
        },
        include: { members: true },
      });

      if (existing) {
        const hasBoth =
          existing.members.some((m) => m.userId === currentUserId) &&
          existing.members.some((m) => m.userId === dto.otherUserId);
        if (hasBoth) {
          return existing;
        }
      }

      const conv = await this.prisma.conversation.create({
        data: {
          type: ConversationType.DIRECT,
          members: {
            create: [
              {
                userId: currentUserId,
                role: ConversationMemberRole.MEMBER,
              },
              {
                userId: dto.otherUserId,
                role: ConversationMemberRole.MEMBER,
              },
            ],
          },
        },
        include: {
          members: true,
        },
      });

      return conv;
    }

    if (dto.type === ConversationType.GROUP) {
      if (!dto.title)
        throw new BadRequestException('title is required for GROUP');
      const memberIds = dto.memberIds ?? [];
      const uniqueMemberIds = Array.from(
        new Set(memberIds.filter((id) => id !== currentUserId)),
      );

      const conv = await this.prisma.conversation.create({
        data: {
          type: ConversationType.GROUP,
          title: dto.title,
          ownerId: currentUserId,
          members: {
            create: [
              {
                userId: currentUserId,
                role: ConversationMemberRole.OWNER,
              },
              ...uniqueMemberIds.map((id) => ({
                userId: id,
                role: ConversationMemberRole.MEMBER,
              })),
            ],
          },
        },
        include: { members: true },
      });

      return conv;
    }

    throw new BadRequestException('Unsupported conversation type');
  }

  async listConversations(userId: string) {
    const convs = await this.prisma.conversation.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: { user: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return convs;
  }

  async getConversation(userId: string, conversationId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: { user: true },
        },
      },
    });

    if (!conv) throw new BadRequestException('Conversation not found');

    const isMember = conv.members.some((m) => m.userId === userId);
    if (!isMember) throw new ForbiddenException();

    return conv;
  }

  async addMember(ownerId: string, conversationId: string, memberId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });

    if (!conv) throw new BadRequestException('Conversation not found');
    if (conv.type !== ConversationType.GROUP) {
      throw new BadRequestException('Only GROUP can add members');
    }
    if (conv.ownerId !== ownerId) throw new ForbiddenException();

    const exists = conv.members.some((m) => m.userId === memberId);
    if (exists) return conv;

    await this.prisma.conversationMember.create({
      data: {
        conversationId,
        userId: memberId,
        role: ConversationMemberRole.MEMBER,
      },
    });

    const updated = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: { include: { user: true } } },
    });

    return updated;
  }

  async removeMember(
    ownerId: string,
    conversationId: string,
    memberId: string,
  ) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });

    if (!conv) throw new BadRequestException('Conversation not found');
    if (conv.type !== ConversationType.GROUP) {
      throw new BadRequestException('Only GROUP can remove members');
    }

    if (conv.ownerId !== ownerId) throw new ForbiddenException();

    if (memberId === ownerId) {
      throw new BadRequestException('Owner cannot be removed');
    }

    await this.prisma.conversationMember.deleteMany({
      where: {
        conversationId,
        userId: memberId,
      },
    });

    return { success: true };
  }

  async ensureMember(userId: string, conversationId: string) {
    const member = await this.prisma.conversationMember.findFirst({
      where: { conversationId, userId },
    });
    if (!member) throw new ForbiddenException();
    return member;
  }
}
