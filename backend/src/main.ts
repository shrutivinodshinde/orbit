import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AuditLogInterceptor } from './audit-logs/audit-log.interceptor';
import { AuditLogsService } from './audit-logs/audit-logs.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'https://orbit-business-management.web.app',
    ],
    credentials: true,
  });

  const auditLogsService = app.get(AuditLogsService);
  app.useGlobalInterceptors(new AuditLogInterceptor(auditLogsService));

  const port = process.env.PORT ?? 5000;
  await app.listen(port);
  console.log(`🚀 Orbit backend running on http://localhost:${port}`);
}
bootstrap();