import { IsEnum, IsUUID } from 'class-validator';
import { ReactionType } from 'src/generated/prisma/enums';

export class ReactMessageDto {
  @IsUUID()
  messageId: string;

  @IsEnum(ReactionType)
  type: ReactionType;
}
