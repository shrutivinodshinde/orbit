import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface JwtPayload {
  sub: number;
  email: string;
  roleId: number;
  roleName: string;
  companyId: number;
  countryId: number | null;
  branchId: number | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(user, user.role.name);
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        companyId: dto.companyId,
        roleId: dto.roleId,
        countryId: dto.countryId,
        branchId: dto.branchId,
      },
      include: { role: true },
    });

    return this.buildAuthResponse(user, user.role.name);
  }

  private buildAuthResponse(
    user: {
      id: number; email: string; name: string; roleId: number;
      companyId: number; countryId: number | null; branchId: number | null;
    },
    roleName: string,
  ) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName,
      companyId: user.companyId,
      countryId: user.countryId,
      branchId: user.branchId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: roleName,
        companyId: user.companyId,
        countryId: user.countryId,
        branchId: user.branchId,
      },
    };
  }
}