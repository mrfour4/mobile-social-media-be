// src/friends/dtos/block-user.dto.ts
import { IsString } from 'class-validator';

export class BlockUserDto {
  @IsString()
  targetUserId: string;
}
