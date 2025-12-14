// src/chat/dtos/messages-cursor-query.dto.ts
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class MessagesCursorQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit: number = 20;
}
