import { IsUUID } from 'class-validator';

export class UnreactMessageDto {
  @IsUUID()
  messageId: string;
}
