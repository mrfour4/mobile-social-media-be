import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConversationsService } from 'src/conversations/conversations.service';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import { MessageType } from '../generated/prisma/enums';
import { MessagesCursorQueryDto } from './dtos/messages-cursor-query.dto';
import { SendMessageDto } from './dtos/send-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationsService: ConversationsService,
  ) {}

  async getMessages(
    userId: string,
    conversationId: string,
    query: MessagesCursorQueryDto,
  ) {
    await this.conversationsService.ensureMember(userId, conversationId);

    const { cursor, limit } = query;

    let cursorMessage: { id: string; createdAt: Date } | null = null;

    if (cursor) {
      cursorMessage = await this.prisma.message.findFirst({
        where: {
          id: cursor,
          conversationId,
        },
        select: {
          id: true,
          createdAt: true,
        },
      });
    }

    const where: Prisma.MessageWhereInput = {
      conversationId,
    };

    if (cursorMessage) {
      where.OR = [
        { createdAt: { lt: cursorMessage.createdAt } },
        {
          createdAt: cursorMessage.createdAt,
          id: { lt: cursorMessage.id },
        },
      ];
    }

    const messages = await this.prisma.message.findMany({
      where,
      include: {
        sender: true,
        reads: true,
        reactions: true,
      },
      orderBy: [{ createdAt: 'desc' }],
      take: limit,
    });

    const hasMore = messages.length === limit;
    const nextCursor = hasMore ? messages[messages.length - 1].id : null;

    return {
      items: messages,
      nextCursor,
      hasMore,
    };
  }

  async sendMessage(userId: string, dto: SendMessageDto) {
    await this.conversationsService.ensureMember(userId, dto.conversationId);

    if (dto.type === MessageType.TEXT && !dto.content) {
      throw new BadRequestException('content is required for TEXT');
    }

    if (
      (dto.type === MessageType.IMAGE || dto.type === MessageType.FILE) &&
      !dto.mediaUrl
    ) {
      throw new BadRequestException('mediaUrl is required for media messages');
    }

    if (dto.replyToMessageId) {
      const parent = await this.prisma.message.findUnique({
        where: { id: dto.replyToMessageId },
      });
      if (!parent || parent.conversationId !== dto.conversationId) {
        throw new BadRequestException('Invalid replyToMessageId');
      }
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        senderId: userId,
        type: dto.type,
        content: dto.content,
        mediaUrl: dto.mediaUrl,
        replyToMessageId: dto.replyToMessageId ?? null,
        reads: {
          create: {
            userId,
          },
        },
      },
      include: {
        sender: true,
      },
    });

    await this.prisma.conversation.update({
      where: { id: dto.conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async markMessageRead(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Message not found');

    await this.conversationsService.ensureMember(
      userId,
      message.conversationId,
    );

    await this.prisma.messageRead.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
      update: { readAt: new Date() },
      create: {
        messageId,
        userId,
      },
    });

    return { success: true };
  }
}
