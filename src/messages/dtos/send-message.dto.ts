// src/chat/dtos/send-message.dto.ts
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { MessageType } from '../../generated/prisma/enums';

export class SendMessageDto {
  @IsUUID()
  conversationId: string;

  @IsEnum(MessageType)
  type: MessageType;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsUUID()
  replyToMessageId?: string;
}
