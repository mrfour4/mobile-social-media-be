// src/uploads/dtos/create-signature.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class CreateSignatureDto {
  @IsOptional()
  @IsString()
  folder?: string;

  @IsOptional()
  @IsString()
  type?: string; // image, video
}
