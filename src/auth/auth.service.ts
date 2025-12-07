import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomInt } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  private async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }

  private parseExpires(
    value: string | undefined,
    fallbackSeconds: number,
  ): number {
    if (!value) return fallbackSeconds;

    const match = value.match(/^(\d+)([smhd])$/);
    if (!match) return fallbackSeconds;

    const amount = Number(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return amount;
      case 'm':
        return amount * 60;
      case 'h':
        return amount * 60 * 60;
      case 'd':
        return amount * 60 * 60 * 24;
      default:
        return fallbackSeconds;
    }
  }

  private generateTokens(userId: string, role: string) {
    const payload = { sub: userId, role };

    const accessExpires = this.parseExpires(
      this.config.get<string>('JWT_ACCESS_EXPIRES_IN'),
      15 * 60,
    );

    const refreshExpires = this.parseExpires(
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN'),
      7 * 24 * 60 * 60,
    );

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessExpires,
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpires,
    });

    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const passwordHash = await this.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
      },
    });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    const verifyLink = `${this.config.get('APP_URL')}/api/auth/verify-email?token=${token}`;

    await this.emailService.sendMail(
      user.email,
      'Verify your email',
      `<p>Click to verify: <a href="${verifyLink}">${verifyLink}</a></p>`,
    );

    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      omit: {
        passwordHash: false,
      },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (user.isBanned) throw new UnauthorizedException('User is banned');

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email is not verified');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const tokens = this.generateTokens(user.id, user.role);

    const tokenHash = await this.hashPassword(tokens.refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const { passwordHash, ...safe } = user;
    return { user: safe, ...tokens };
  }

  async refresh(refreshToken: string) {
    let payload: any;
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    const found = await Promise.all(
      tokens.map(async (t) => ({
        match: await bcrypt.compare(refreshToken, t.tokenHash),
        t,
      })),
    );

    const matched = found.find((f) => f.match)?.t;
    if (!matched) throw new UnauthorizedException('Refresh token not found');

    const newTokens = this.generateTokens(payload.sub, payload.role);

    matched.revokedAt = new Date();
    await this.prisma.refreshToken.update({
      where: { id: matched.id },
      data: { revokedAt: matched.revokedAt },
    });

    const newHash = await this.hashPassword(newTokens.refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: {
        userId: payload.sub,
        tokenHash: newHash,
        expiresAt,
      },
    });

    return newTokens;
  }

  async verifyEmail(token: string) {
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
    });
    if (!record) throw new BadRequestException('Token not found');

    if (record.usedAt) throw new BadRequestException('Token already used');
    if (record.expiresAt < new Date())
      throw new BadRequestException('Token expired');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { isEmailVerified: true },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { success: true };
  }

  async requestResetPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { success: true };

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');

    const expiresAt = new Date(Date.now() + 1000 * 60 * 10);

    const codeHash = await this.hashPassword(code);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: codeHash,
        expiresAt,
        usedAt: null,
      },
    });

    await this.emailService.sendMail(
      user.email,
      'Reset your password',
      `<p>Your reset code is: <b>${code}</b></p>
     <p>This code will expire in 10 minutes.</p>`,
    );

    return { success: true };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      omit: { passwordHash: false },
    });
    if (!user) {
      throw new BadRequestException('Invalid email or code');
    }

    const record = await this.prisma.passwordResetToken.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) throw new BadRequestException('Invalid email or code');
    if (record.usedAt) throw new BadRequestException('Code already used');
    if (record.expiresAt < new Date())
      throw new BadRequestException('Code expired');

    const ok = await bcrypt.compare(code, record.token);
    if (!ok) throw new BadRequestException('Invalid email or code');

    const hash = await this.hashPassword(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { success: true };
  }
}
