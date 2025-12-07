// src/posts/dtos/create-post.dto.ts
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { MediaType, Privacy } from '../../generated/prisma/enums';

class MediaItemDto {
  @IsEnum(MediaType)
  type: MediaType;

  @IsString()
  url: string;

  @IsOptional()
  size?: number;
}

export class CreatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  text?: string;

  @IsEnum(Privacy)
  privacy: Privacy;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaItemDto)
  media?: MediaItemDto[];
}
