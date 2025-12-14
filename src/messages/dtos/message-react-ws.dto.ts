import { IsEnum, IsUUID } from 'class-validator';
import { ReactionType } from 'src/generated/prisma/enums';

export class MessageReactDto {
  @IsUUID()
  messageId: string;

  @IsEnum(ReactionType)
  type: ReactionType;
}

export class MessageUnreactDto {
  @IsUUID()
  messageId: string;
}
