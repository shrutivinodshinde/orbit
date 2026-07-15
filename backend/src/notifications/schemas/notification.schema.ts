import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ required: true, index: true })
  companyId: number;

  @Prop({ required: true, index: true })
  userId: number;

  @Prop({ required: true })
  type: string; // e.g. 'low_stock', 'customs_delay', 'order_status_change'

  @Prop({ required: true })
  message: string;

  @Prop({ default: false, index: true })
  read: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);