// src/reactions/reactions.module.ts
import { Module } from '@nestjs/common';
import { ReactionsController } from './reactions.controller';
import { ReactionsService } from './reactions.service';

@Module({
  providers: [ReactionsService],
  controllers: [ReactionsController],
})
export class ReactionsModule {}
