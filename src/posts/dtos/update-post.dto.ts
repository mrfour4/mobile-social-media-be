// src/posts/dtos/update-post.dto.ts
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Privacy } from '../../generated/prisma/enums';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  text?: string;

  @IsOptional()
  @IsEnum(Privacy)
  privacy?: Privacy;
}
