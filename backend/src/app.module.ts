import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { DatabaseModule } from './database/mongo.module';
import { AuthModule } from './auth/auth.module';
import { RbacModule } from './rbac/rbac.module';
import { SalesModule } from './sales/sales.module';
import { ExportModule } from './export/export.module';
import { AttendanceModule } from './attendance/attendance.module';
import { CompaniesModule } from './companies/companies.module';
import { CountriesModule } from './countries/countries.module';
import { BranchesModule } from './branches/branches.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AiAgentModule } from './ai-agent/ai-agent.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.local' }),
    PrismaModule,
    DatabaseModule,
    RbacModule,
    AuthModule,
    SalesModule,
    ExportModule,
    AttendanceModule,
    CompaniesModule,
    CountriesModule,
    BranchesModule,
    UsersModule,
    CustomersModule,
    AuditLogsModule,
    NotificationsModule,
    AiAgentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}