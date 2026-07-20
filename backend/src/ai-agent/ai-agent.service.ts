import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Groq from 'groq-sdk';
import { ConfigService } from '@nestjs/config';
import { ChatHistory } from './schemas/chat-history.schema';
import { AI_TOOLS } from './ai-tools';
import { JwtPayload } from '../auth/auth.service';
import { SalesService } from '../sales/sales.service';
import { ExportService } from '../export/export.service';
import { AttendanceService } from '../attendance/attendance.service';
import { RbacService } from '../rbac/rbac.service';

const SYSTEM_PROMPT = `You are Orbit's AI business assistant. You help users understand their company's sales, export, and attendance data across countries and branches.
Always use the provided tools to fetch real data before answering questions about numbers, statuses, or records — never guess or make up figures.
Keep answers concise and business-focused. If the user asks about data outside the available tools, say so honestly.`;

const GROQ_MODEL = 'llama-3.3-70b-versatile';

type ChatMsg = Groq.Chat.Completions.ChatCompletionMessageParam;

@Injectable()
export class AiAgentService {
  private readonly groq: Groq;

  constructor(
    @InjectModel(ChatHistory.name) private readonly chatHistoryModel: Model<ChatHistory>,
    private readonly configService: ConfigService,
    private readonly rbacService: RbacService,
    private readonly salesService: SalesService,
    private readonly exportService: ExportService,
    private readonly attendanceService: AttendanceService,
  ) {
    this.groq = new Groq({ apiKey: this.configService.get<string>('GROQ_API_KEY') });
  }

  async chat(user: JwtPayload, message: string) {
    if (!(await this.rbacService.hasPermissions(user.sub, user.roleId, ['use_ai_assistant']))) {
      throw new ForbiddenException('You do not have access to the AI assistant');
    }

    const history = await this.getOrCreateHistory(user.sub);

    const messages: ChatMsg[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.messages.map((m) => ({ role: m.role, content: m.content }) as ChatMsg),
      { role: 'user', content: message },
    ];

    const finalText = await this.runConversationLoop(user, messages);

    history.messages.push({ role: 'user', content: message, timestamp: new Date() } as any);
    history.messages.push({ role: 'assistant', content: finalText, timestamp: new Date() } as any);
    await history.save();

    return { reply: finalText };
  }

  private async runConversationLoop(user: JwtPayload, messages: ChatMsg[]): Promise<string> {
    let response = await this.groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: 1024,
      tools: AI_TOOLS,
      messages,
    });

    let choice = response.choices[0];

    // Loop while Groq wants to call tools, feeding results back in, until it gives a final text answer
    while (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCalls = choice.message.tool_calls;

      // Push the assistant's tool-call message back into history exactly as returned
      messages.push({
        role: 'assistant',
        content: choice.message.content ?? null,
        tool_calls: toolCalls,
      });

      // Execute each requested tool, then push one 'tool' role message per call
      for (const call of toolCalls) {
        let input: Record<string, unknown> = {};
        try {
          input = JSON.parse(call.function.arguments || '{}');
        } catch {
          input = {};
        }

        const result = await this.executeTool(user, call.function.name, input);

        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }

      response = await this.groq.chat.completions.create({
        model: GROQ_MODEL,
        max_tokens: 1024,
        tools: AI_TOOLS,
        messages,
      });
      choice = response.choices[0];
    }

    return choice.message.content ?? 'I was unable to generate a response.';
  }

  /** Routes each tool call through the SAME scoped services used by the REST API — the AI can never see more than the user could. */
  private async executeTool(user: JwtPayload, name: string, input: Record<string, unknown>) {
    switch (name) {
      case 'get_sales_summary': {
        const result = await this.salesService.findAll(user, { status: input.status as any, page: 1, pageSize: 100 });
        return {
          totalOrders: result.total,
          totalAmount: result.data.reduce((sum, o) => sum + Number(o.amount), 0),
          orders: result.data.map((o) => ({ id: o.id, amount: o.amount, status: o.status, branch: o.branch.name })),
        };
      }
      case 'get_export_summary': {
        const result = await this.exportService.findAll(user, { customsStatus: input.customsStatus as any, page: 1, pageSize: 100 });
        return {
          totalShipments: result.total,
          shipments: result.data.map((s) => ({ id: s.id, status: s.status, customsStatus: s.customsStatus, destination: s.destinationCountry, branch: s.branch.name })),
        };
      }
      case 'get_attendance_summary': {
        const result = await this.attendanceService.findAll(user, { status: input.status as any, page: 1, pageSize: 100 });
        return {
          totalRecords: result.total,
          records: result.data.map((a) => ({ user: a.user.name, status: a.status, date: a.date })),
        };
      }
      default:
        return { error: `Unknown tool: ${name}` };
    }
  }

  private async getOrCreateHistory(userId: number) {
    let history = await this.chatHistoryModel.findOne({ userId });
    if (!history) {
      history = await this.chatHistoryModel.create({ userId, messages: [] });
    }
    return history;
  }

  async getHistory(userId: number) {
    const history = await this.chatHistoryModel.findOne({ userId }).lean();
    return history?.messages ?? [];
  }
}