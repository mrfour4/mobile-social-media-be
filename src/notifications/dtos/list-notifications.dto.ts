// src/notifications/dtos/list-notifications.dto.ts
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ListNotificationsDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit: number = 20;
}
