import api from './client'
import type { MoneyRequest, PaginatedResponse } from '@/types'

export const requestsApi = {
  getAll: (params?: { page?: number; limit?: number; type?: 'all' | 'sent' | 'received' }) =>
    api.get<PaginatedResponse<MoneyRequest>>('/requests', { params }),

  getOne: (id: number) => api.get<{ request: MoneyRequest }>(`/requests/${id}`),

  create: (data: {
    target_email: string
    amount: number
    currency: string
    note?: string
    expires_in_hours?: number
  }) => api.post<{ request: MoneyRequest }>('/requests', data),

  pay: (id: number, data: { currency: string }) =>
    api.post<{ message: string }>(`/requests/${id}/pay`, data),

  decline: (id: number) => api.post(`/requests/${id}/decline`),

  cancel: (id: number) => api.post(`/requests/${id}/cancel`),
}
