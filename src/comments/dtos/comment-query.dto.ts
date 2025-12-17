import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CommentQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  limit: number = 20;
}
