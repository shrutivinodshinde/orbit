import Groq from 'groq-sdk';

export const AI_TOOLS: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_sales_summary',
      description:
        'Get sales orders within the scope of the current user, optionally filtered by status. Returns totals and a list of orders.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
            description: 'Optional filter by order status',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_export_summary',
      description:
        'Get export shipments within the scope of the current user, optionally filtered by customs status.',
      parameters: {
        type: 'object',
        properties: {
          customsStatus: {
            type: 'string',
            enum: ['PENDING', 'CLEARED', 'HELD'],
            description: 'Optional filter by customs status',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_attendance_summary',
      description: 'Get attendance records within the scope of the current user.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['PRESENT', 'ABSENT', 'LEAVE'],
            description: 'Optional filter by attendance status',
          },
        },
      },
    },
  },
];