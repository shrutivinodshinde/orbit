import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ActivityLog extends Document {
  @Prop({ required: true, index: true })
  companyId: number;

  @Prop({ required: true, index: true })
  userId: number;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: true, index: true })
  action: string; // e.g. 'sales.create', 'export.update_status', 'users.permission_override'

  @Prop({ required: true })
  entityType: string; // e.g. 'SalesOrder'

  @Prop()
  entityId?: number;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;

  @Prop({ required: true })
  method: string; // HTTP method

  @Prop({ required: true })
  path: string;
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);
ActivityLogSchema.index({ companyId: 1, createdAt: -1 });