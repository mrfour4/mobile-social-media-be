// src/users/users.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async getMe(userId: string) {
    const user = await this.findById(userId);
    if (!user) return null;

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });

    return user;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      omit: { passwordHash: false },
    });
    if (!user) throw new BadRequestException('User not found');

    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) throw new BadRequestException('Current password is incorrect');

    const newHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { success: true };
  }
}
