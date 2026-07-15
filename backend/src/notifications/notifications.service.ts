import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(@InjectModel(Notification.name) private readonly notificationModel: Model<Notification>) {}

  create(companyId: number, userId: number, type: string, message: string) {
    return this.notificationModel.create({ companyId, userId, type, message });
  }

  findMine(userId: number) {
    return this.notificationModel.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
  }

  async markRead(userId: number, id: string) {
    await this.notificationModel.updateOne({ _id: id, userId }, { read: true });
    return { success: true };
  }
}