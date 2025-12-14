// src/notifications/dtos/mark-read.dto.ts
import { ArrayNotEmpty, IsArray, IsOptional, IsString } from 'class-validator';

export class MarkReadDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids?: string[];
}
