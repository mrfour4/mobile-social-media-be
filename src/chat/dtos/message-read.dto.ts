// src/chat/dtos/message-read.dto.ts
import { IsUUID } from 'class-validator';

export class MessageReadDto {
  @IsUUID()
  messageId: string;
}
