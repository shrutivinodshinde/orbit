import { axiosClient } from './axiosClient';

export const usersApi = {
  getAll: (params?: Record<string, unknown>) =>
    axiosClient.get('/users', { params }).then((r) => r.data),

  getOne: (id: number) =>
    axiosClient.get(`/users/${id}`).then((r) => r.data),

  update: (id: number, data: Record<string, unknown>) =>
    axiosClient.patch(`/users/${id}`, data).then((r) => r.data),

  getPermissions: (id: number) =>
    axiosClient.get(`/users/${id}/permissions`).then((r) => r.data),

  setPermissionOverride: (id: number, permissionId: number, granted: boolean) =>
    axiosClient.post(`/users/${id}/permissions`, { permissionId, granted }).then((r) => r.data),

  removePermissionOverride: (id: number, permissionId: number) =>
    axiosClient.delete(`/users/${id}/permissions/${permissionId}`).then((r) => r.data),

  // FIXED — fetches from DB instead of hardcoding
  getRoles: () =>
    axiosClient.get('/users/roles').then((r) => r.data),
};