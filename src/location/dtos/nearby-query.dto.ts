// src/location/dtos/nearby-query.dto.ts
import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class NearbyQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  radiusKm: number = 2;
}
