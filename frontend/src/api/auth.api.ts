import { axiosClient } from './axiosClient';
import type { LoginResponse, AuthUser } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    axiosClient
      .post<LoginResponse>('/auth/login', { email, password })
      .then((r) => r.data),

  me: () =>
    axiosClient
      .get<AuthUser>('/auth/me')
      .then((r) => r.data),
};