import api from './client'
import type { Split, PaginatedResponse } from '@/types'

export const splitsApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Split>>('/splits', { params }),

  getOne: (id: number) => api.get<{ split: Split }>(`/splits/${id}`),

  create: (data: {
    title: string
    total_amount: number
    currency: string
    split_type: 'equal' | 'custom' | 'percentage'
    members: Array<{ email: string; amount?: number; percentage?: number }>
  }) => api.post<{ split: Split }>('/splits', data),

  settle: (id: number, data: { currency: string }) =>
    api.post<{ message: string }>(`/splits/${id}/settle`, data),
}
