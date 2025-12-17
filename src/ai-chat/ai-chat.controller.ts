import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AiChatService } from './ai-chat.service';
import { ChatbotRequestDto } from './dto/chatbot.dto';

interface CurrentUserPayload {
  id: string;
  email: string;
}

@Controller('/ai')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @UseGuards(JwtAuthGuard)
  @Post('chat')
  async chat(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ChatbotRequestDto,
  ) {
    return await this.aiChatService.chat(
      user.id,
      dto.message,
      dto.history ?? [],
    );
  }
}
