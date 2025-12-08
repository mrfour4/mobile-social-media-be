// src/chat/dtos/send-message.dto.ts
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MessageType } from '../../generated/prisma/enums';

export class SendMessageDto {
  @IsString()
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
  @IsString()
  replyToMessageId?: string;
}
