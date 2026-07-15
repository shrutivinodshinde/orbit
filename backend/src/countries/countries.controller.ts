import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { CountriesService } from './countries.service';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { JwtPayload } from '../auth/auth.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';

@Controller('countries')
@UseGuards(JwtAuthGuard)
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  findAll(@Req() req: { user: JwtPayload }) {
    return this.countriesService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Req() req: { user: JwtPayload }, @Param('id', ParseIntPipe) id: number) {
    return this.countriesService.findOne(req.user, id);
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('manage_org_structure')
  create(@Req() req: { user: JwtPayload }, @Body() dto: CreateCountryDto) {
    return this.countriesService.create(req.user, dto);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('manage_org_structure')
  update(@Req() req: { user: JwtPayload }, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCountryDto) {
    return this.countriesService.update(req.user, id, dto);
  }
}