import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ActivityLog } from './schemas/activity-log.schema';
import { JwtPayload } from '../auth/auth.service';

export interface LogEntryInput {
  user: JwtPayload;
  action: string;
  entityType: string;
  entityId?: number;
  metadata?: Record<string, unknown>;
  method: string;
  path: string;
}

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(@InjectModel(ActivityLog.name) private readonly activityLogModel: Model<ActivityLog>) {}

  /** Fire-and-forget — logging failures should never break the actual request. */
  record(entry: LogEntryInput): void {
    this.activityLogModel
      .create({
        companyId: entry.user.companyId,
        userId: entry.user.sub,
        userName: entry.user.email,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: entry.metadata,
        method: entry.method,
        path: entry.path,
      })
      .catch((err) => this.logger.error(`Failed to write audit log: ${err.message}`));
  }

  async findAll(user: JwtPayload, page = 1, pageSize = 30) {
    const filter: Record<string, unknown> = { companyId: user.companyId };

    // Country Admins and below only see logs from users in their own scope
    if (user.roleName !== 'Super Admin') {
      // TODO: Full team-scoped audit visibility (Manager sees branch team logs)
      // requires fetching scoped user IDs from Postgres then using { userId: { $in: ids } }
      // Currently non-Super-Admins see only their own actions — safe and correct, just limited scope
      filter.userId = user.sub;
    }

    const [data, total] = await Promise.all([
      this.activityLogModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
      this.activityLogModel.countDocuments(filter),
    ]);

    return { data, total, page, pageSize };
  }
}