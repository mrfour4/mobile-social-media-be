// src/auth/dtos/verify-email.dto.ts
import { IsString } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  token: string;
}
