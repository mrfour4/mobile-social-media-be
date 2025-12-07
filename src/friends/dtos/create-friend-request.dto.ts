// src/friends/dtos/create-friend-request.dto.ts
import { IsString } from 'class-validator';

export class CreateFriendRequestDto {
  @IsString()
  toUserId: string;
}
