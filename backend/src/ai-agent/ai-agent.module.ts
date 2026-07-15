import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiAgentController } from './ai-agent.controller';
import { AiAgentService } from './ai-agent.service';
import { ChatHistory, ChatHistorySchema } from './schemas/chat-history.schema';
import { SalesModule } from '../sales/sales.module';
import { ExportModule } from '../export/export.module';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ChatHistory.name, schema: ChatHistorySchema }]),
    SalesModule,
    ExportModule,
    AttendanceModule,
  ],
  controllers: [AiAgentController],
  providers: [AiAgentService],
})
export class AiAgentModule {}