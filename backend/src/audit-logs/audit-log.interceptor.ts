import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditLogsService } from './audit-logs.service';
import { JwtPayload } from '../auth/auth.service';

const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, path, params, user } = request as {
      method: string; path: string; params: Record<string, string>; user?: JwtPayload;
    };

    if (!WRITE_METHODS.has(method) || !user) {
      return next.handle();
    }

    const controllerName = context.getClass().name.replace('Controller', '');

    return next.handle().pipe(
      tap((result) => {
        this.auditLogsService.record({
          user,
          action: `${controllerName.toLowerCase()}.${method.toLowerCase()}`,
          entityType: controllerName,
          entityId: params?.id ? Number(params.id) : (result?.id ?? undefined),
          method,
          path,
        });
      }),
    );
  }
}