// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAccessStrategy } from './jwt-access.strategy';

@Module({
  imports: [JwtModule.register({})],
  providers: [AuthService, JwtAccessStrategy, EmailService],
  controllers: [AuthController],
})
export class AuthModule {}
