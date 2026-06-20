import api from './client'
import type { Wallet, Transaction, PaginatedResponse } from '@/types'

export const walletsApi = {
  getAll: () => api.get<{ wallets: Wallet[] }>('/wallets'),

  getOne: (currency: string) =>
    api.get<{ wallet: Wallet }>(`/wallets/${currency}`),

  getTransactions: (params?: { page?: number; limit?: number; currency?: string }) =>
    api.get<PaginatedResponse<Transaction>>('/wallets/transactions', { params }),

  send: (data: {
    receiver_email: string
    amount: number
    currency: string
    target_currency?: string
    note?: string
  }) => api.post<{ message: string; transaction: Transaction }>('/wallets/send', data),
}
