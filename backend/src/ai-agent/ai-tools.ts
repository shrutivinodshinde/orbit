import Anthropic from '@anthropic-ai/sdk';

export const AI_TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_sales_summary',
    description: 'Get sales orders within the scope of the current user, optionally filtered by status. Returns totals and a list of orders.',
    input_schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'CANCELLED'], description: 'Optional filter by order status' },
      },
    },
  },
  {
    name: 'get_export_summary',
    description: 'Get export shipments within the scope of the current user, optionally filtered by customs status.',
    input_schema: {
      type: 'object',
      properties: {
        customsStatus: { type: 'string', enum: ['PENDING', 'CLEARED', 'HELD'], description: 'Optional filter by customs status' },
      },
    },
  },
  {
    name: 'get_attendance_summary',
    description: 'Get attendance records within the scope of the current user.',
    input_schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['PRESENT', 'ABSENT', 'LEAVE'], description: 'Optional filter by attendance status' },
      },
    },
  },
];