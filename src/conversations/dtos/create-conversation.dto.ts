// src/chat/dtos/create-conversation.dto.ts
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { ConversationType } from '../../generated/prisma/enums';

export class CreateConversationDto {
  @IsEnum(ConversationType)
  type: ConversationType;

  @IsOptional()
  @IsString()
  title?: string; //  GROUP/BOT

  @IsOptional()
  @IsString()
  otherUserId?: string; // DIRECT

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  memberIds?: string[]; // GROUP (exclude owner)
}
