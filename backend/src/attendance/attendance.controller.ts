import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { JwtPayload } from '../auth/auth.service';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // Self-service — every authenticated user, no extra permission required
  @Post('check-in')
  checkIn(@Req() req: { user: JwtPayload }) {
    return this.attendanceService.checkIn(req.user);
  }

  @Post('check-out')
  checkOut(@Req() req: { user: JwtPayload }) {
    return this.attendanceService.checkOut(req.user);
  }

  @Get('me')
  findMine(@Req() req: { user: JwtPayload }, @Query() query: QueryAttendanceDto) {
    return this.attendanceService.findMine(req.user, query);
  }

  // Team/scoped views — permission-gated
  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_attendance')
  findAll(@Req() req: { user: JwtPayload }, @Query() query: QueryAttendanceDto) {
    return this.attendanceService.findAll(req.user, query);
  }

  @Post('mark')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('manage_attendance')
  mark(@Req() req: { user: JwtPayload }, @Body() dto: MarkAttendanceDto) {
    return this.attendanceService.mark(req.user, dto);
  }
}