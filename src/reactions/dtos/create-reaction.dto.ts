// src/reactions/dtos/create-reaction.dto.ts
import { IsEnum, IsString } from 'class-validator';
import { ReactionTargetType, ReactionType } from '../../generated/prisma/enums';

export class CreateReactionDto {
  @IsEnum(ReactionTargetType)
  targetType: ReactionTargetType;

  @IsString()
  targetId: string;

  @IsEnum(ReactionType)
  type: ReactionType;
}
