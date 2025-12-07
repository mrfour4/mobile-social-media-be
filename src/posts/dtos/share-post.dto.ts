// src/posts/dtos/share-post.dto.ts
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SharePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  text?: string;
}
