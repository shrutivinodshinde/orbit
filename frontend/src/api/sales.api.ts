import { axiosClient } from './axiosClient';

export const salesApi = {
  getAll: (params?: Record<string, unknown>) =>
    axiosClient.get('/sales', { params }).then((r) => r.data),

  getOne: (id: number) =>
    axiosClient.get(`/sales/${id}`).then((r) => r.data),

  create: (payload: {
    branchId: number;
    customerId: number;
    items: { productName: string; quantity: number; unitPrice: number }[];
  }) => axiosClient.post('/sales', payload).then((r) => r.data),

  updateStatus: (id: number, status: string) =>
    axiosClient.patch(`/sales/${id}/status`, { status }).then((r) => r.data),
};