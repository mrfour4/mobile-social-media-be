// src/posts/dtos/feed-query.dto.ts
import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class FeedQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit: number = 10;
}
