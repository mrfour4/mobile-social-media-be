// src/auth/dtos/request-reset-password.dto.ts
import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
