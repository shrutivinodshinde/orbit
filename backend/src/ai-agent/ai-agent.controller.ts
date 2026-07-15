import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AiAgentService } from './ai-agent.service';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/auth.service';
import { ChatDto } from './dto/chat.dto';

@Controller('ai-agent')
@UseGuards(JwtAuthGuard)
export class AiAgentController {
  constructor(private readonly aiAgentService: AiAgentService) {}

  @Post('chat')
  chat(@Req() req: { user: JwtPayload }, @Body() dto: ChatDto) {
    return this.aiAgentService.chat(req.user, dto.message);
  }

  @Get('history')
  getHistory(@Req() req: { user: JwtPayload }) {
    return this.aiAgentService.getHistory(req.user.sub);
  }
}