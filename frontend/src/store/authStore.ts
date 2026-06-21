import { create } from 'zustand'

type User = {
  id: number
  email: string
  full_name: string
  avatar_url: string | null
  role: string
  status: string
  subscription_tier: string
  email_verified: boolean
}

type AuthState = {
  accessToken: string | null
  user: User | null
  setAuth: (accessToken: string, user: User) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setAuth: (accessToken, user) => set({ accessToken, user }),
  clearAuth: () => set({ accessToken: null, user: null }),
}))