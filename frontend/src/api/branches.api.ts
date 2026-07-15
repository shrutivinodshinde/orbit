import { axiosClient } from './axiosClient';

export const branchesApi = {
  getAll: (params?: Record<string, unknown>) =>
    axiosClient.get('/branches', { params }).then((r) => r.data),
};