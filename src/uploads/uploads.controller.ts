// src/uploads/uploads.controller.ts
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateSignatureDto } from './dtos/create-signature.dto';
import { UploadsService } from './uploads.service';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('signature')
  createSignature(@Body() dto: CreateSignatureDto) {
    return this.uploadsService.generateSignature(dto.folder);
  }
}
