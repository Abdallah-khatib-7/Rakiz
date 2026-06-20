import api from './client'
import type { User } from '@/types'

export const usersApi = {
  updateAvatar: (file: File) => {
    const form = new FormData()
    form.append('avatar', file)
    return api.post<{ avatar_url: string; user: User }>('/users/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
