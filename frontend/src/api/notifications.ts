import api from './client'
import type { Notification, PaginatedResponse } from '@/types'

export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number; unread_only?: boolean }) =>
    api.get<PaginatedResponse<Notification>>('/notifications', { params }),

  markRead: (id: number) => api.patch(`/notifications/${id}/read`),

  markAllRead: () => api.patch('/notifications/read-all'),
}
