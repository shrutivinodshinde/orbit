import { axiosClient } from './axiosClient';

export const aiApi = {
  chat: (message: string) =>
    axiosClient.post('/ai-agent/chat', { message }).then((r) => r.data),

  getHistory: () =>
    axiosClient.get('/ai-agent/history').then((r) => r.data),
};