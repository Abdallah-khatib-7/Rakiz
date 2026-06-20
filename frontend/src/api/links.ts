import api from './client'
import type { PaymentLink, PaginatedResponse } from '@/types'

export const linksApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<PaymentLink>>('/links', { params }),

  getOne: (id: number) => api.get<{ link: PaymentLink }>(`/links/${id}`),

  getByToken: (token: string) =>
    api.get<{ link: PaymentLink & { creator_name: string } }>(`/links/pay/${token}`),

  create: (data: {
    amount?: number
    currency: string
    description?: string
    is_single_use?: boolean
    expires_in_hours?: number
  }) => api.post<{ link: PaymentLink }>('/links', data),

  pay: (token: string, data: { amount?: number; currency: string }) =>
    api.post<{ message: string }>(`/links/pay/${token}`, data),

  delete: (id: number) => api.delete(`/links/${id}`),
}
