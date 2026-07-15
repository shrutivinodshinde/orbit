import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/auth.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findMine(@Req() req: { user: JwtPayload }) {
    return this.notificationsService.findMine(req.user.sub);
  }

  @Patch(':id/read')
  markRead(@Req() req: { user: JwtPayload }, @Param('id') id: string) {
    return this.notificationsService.markRead(req.user.sub, id);
  }
}