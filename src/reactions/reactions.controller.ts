// src/reactions/reactions.controller.ts
import {
  Body,
  Controller,
  Delete,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ReactionTargetType } from '../generated/prisma/enums';
import { CreateReactionDto } from './dtos/create-reaction.dto';
import { ReactionsService } from './reactions.service';

@Controller('reactions')
@UseGuards(JwtAuthGuard)
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post()
  addReaction(@CurrentUser() user: any, @Body() dto: CreateReactionDto) {
    return this.reactionsService.addReaction(user.sub, dto);
  }

  @Delete()
  removeReaction(
    @CurrentUser() user: any,
    @Query('targetType') targetType: ReactionTargetType,
    @Query('targetId') targetId: string,
  ) {
    return this.reactionsService.removeReaction(user.sub, targetType, targetId);
  }
}
