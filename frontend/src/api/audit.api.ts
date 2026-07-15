import { axiosClient } from './axiosClient';

export const auditApi = {
  getAll: (page = 1, pageSize = 30) =>
    axiosClient.get('/audit-logs', { params: { page, pageSize } }).then((r) => r.data),
};