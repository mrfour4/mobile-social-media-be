// src/comments/dtos/create-comment.dto.ts
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MaxLength(2000)
  content: string;

  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}
