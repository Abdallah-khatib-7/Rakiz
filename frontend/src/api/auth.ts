import api from './client'
import type { User } from '@/types'

export const authApi = {
  register: (data: { email: string; password: string; full_name: string }) =>
    api.post<{ message: string }>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<{ user: User }>('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  refresh: () => api.post('/auth/refresh'),

  me: () => api.get<{ user: User }>('/auth/me'),

  verifyEmail: (token: string) =>
    api.get<{ message: string }>(`/auth/verify-email?token=${token}`),

  googleLogin: () => {
    window.location.href = '/api/auth/google'
  },
}
