import { axiosClient } from './axiosClient';

export const customersApi = {
  getAll: () => axiosClient.get('/customers').then((r) => r.data),
};