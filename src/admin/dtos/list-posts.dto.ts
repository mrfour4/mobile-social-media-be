import { Type } from 'class-transformer';
import { IsBooleanString, IsNumber, IsOptional, Min } from 'class-validator';

export class ListPostsDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit: number = 20;

  @IsOptional()
  @IsBooleanString()
  includeDeleted?: string;

  @IsOptional()
  @IsBooleanString()
  includeHidden?: string;
}
