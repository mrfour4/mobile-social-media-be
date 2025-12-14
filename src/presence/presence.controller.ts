import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PresenceService } from './presence.service';

@Controller('presence')
@UseGuards(JwtAuthGuard)
export class PresenceController {
  constructor(private readonly presenceService: PresenceService) {}

  @Get('user/:userId')
  async getPresence(@Param('userId') userId: string, @Req() req) {
    const viewerId = req.user.sub as string;

    const presence = await this.presenceService.getPresenceForViewer(
      userId,
      viewerId,
    );

    return presence;
  }
}
