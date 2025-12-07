// src/comments/dtos/update-comment.dto.ts
import { IsString, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @IsString()
  @MaxLength(2000)
  content: string;
}
