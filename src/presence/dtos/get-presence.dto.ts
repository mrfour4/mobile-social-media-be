import { IsUUID } from 'class-validator';

export class GetPresenceDto {
  @IsUUID()
  userId: string;
}
