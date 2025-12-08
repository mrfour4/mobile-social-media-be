// src/chat/dtos/join-conversation.dto.ts
import { IsUUID } from 'class-validator';

export class JoinConversationDto {
  @IsUUID()
  conversationId: string;
}
