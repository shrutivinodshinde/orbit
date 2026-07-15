import { axiosClient } from './axiosClient';

export const exportApi = {
  getAll: (params?: Record<string, unknown>) =>
    axiosClient.get('/export', { params }).then((r) => r.data),
};