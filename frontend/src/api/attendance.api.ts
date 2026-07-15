import { axiosClient } from './axiosClient';

export const attendanceApi = {
  getAll: (params?: Record<string, unknown>) =>
    axiosClient.get('/attendance', { params }).then((r) => r.data),
  mine: () => axiosClient.get('/attendance/me').then((r) => r.data),
  checkIn: () => axiosClient.post('/attendance/check-in').then((r) => r.data),
  checkOut: () => axiosClient.post('/attendance/check-out').then((r) => r.data),
};